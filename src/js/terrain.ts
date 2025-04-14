import * as THREE from 'three';
import { LoadingManager } from './loading-manager';
import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise.js';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';

export class Terrain {
    private scene: THREE.Scene;
    private loadingManager: LoadingManager;
    
    private terrain: THREE.Mesh | null = null;
    private roadMesh: THREE.Mesh | null = null;
    
    // Terrain parameters
    private terrainSize: number = 5000;
    private terrainSegments: number = 200;
    private terrainMaxHeight: number = 100;
    private roadWidth: number = 15;
    private chunkSize: number = 1000;
    private visibleDistance: number = 1500;
    
    // Chunk management
    private playerPosition: THREE.Vector3 = new THREE.Vector3();
    private activeChunks: { [key: string]: boolean } = {};
    private chunkMeshes: { [key: string]: THREE.Mesh } = {};
    
    // Decoration elements
    private trees: THREE.Group | null = null;
    private grassPatches: THREE.InstancedMesh | null = null;
    private rocks: THREE.InstancedMesh | null = null;
    
    // Noise generator for terrain height
    private noise: any;
    
    constructor(scene: THREE.Scene, loadingManager: LoadingManager) {
        this.scene = scene;
        this.loadingManager = loadingManager;
        
        // Initialize noise generator
        this.noise = new SimplexNoise();
        
        // Create basic terrain
        this.createBasicTerrain();
        
        // Create road
        this.createRoad();
        
        // Add decorations
        this.createTrees(300);
        this.createGrassPatches(1000);
        this.createRocks(150);
    }
    
    public update(delta: number): void {
        // Update terrain chunks based on player position
        // (This would be called from the Game class with the vehicle's position)
    }
    
    public updatePlayerPosition(position: THREE.Vector3): void {
        this.playerPosition.copy(position);
        
        // Update terrain chunks based on new position
        this.updateTerrainChunks();
    }
    
    public setQuality(quality: string): void {
        // Adjust terrain detail level based on quality
        switch (quality) {
            case 'low':
                // Reduce number of segments and visible distance
                this.terrainSegments = 50;
                this.visibleDistance = 150;
                break;
            case 'medium':
                this.terrainSegments = 100;
                this.visibleDistance = 200;
                break;
            case 'high':
                this.terrainSegments = 200;
                this.visibleDistance = 300;
                break;
        }
        
        // Regenerate terrain with new settings
        // In a real implementation, we would regenerate the terrain
    }
    
    private createBasicTerrain(): void {
        // Create a large flat plane for basic terrain
        const geometry = new THREE.PlaneGeometry(
            this.terrainSize, 
            this.terrainSize, 
            this.terrainSegments, 
            this.terrainSegments
        );
        
        // Apply perlin noise to create height variation
        const vertices = geometry.attributes.position.array;
        
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const z = vertices[i + 2];
            
            // Calculate distance from road for smoother transition
            const distanceFromRoad = Math.abs(x);
            
            if (distanceFromRoad > this.roadWidth / 2) {
                // Apply multi-octave noise for more realistic terrain
                let elevation = 0;
                
                // First octave - general terrain shape
                elevation += this.noise.noise(x * 0.002, 0, z * 0.002) * 50;
                
                // Second octave - medium details
                elevation += this.noise.noise(x * 0.01, 0, z * 0.01) * 20;
                
                // Third octave - small details (only far from road)
                if (distanceFromRoad > this.roadWidth * 2) {
                    elevation += this.noise.noise(x * 0.05, 0, z * 0.05) * 5;
                }
                
                // Smooth transition from road to terrain
                const transitionWidth = this.roadWidth * 2;
                const roadProximity = Math.max(0, 1 - ((distanceFromRoad - this.roadWidth/2) / transitionWidth));
                const smoothedElevation = roadProximity > 0 ? 
                    elevation * (1 - Math.pow(roadProximity, 2)) : 
                    elevation;
                
                vertices[i + 1] = smoothedElevation;
            } else {
                // Keep road area perfectly flat
                vertices[i + 1] = 0;
            }
        }
        
        // Compute normals for proper lighting
        geometry.computeVertexNormals();
        
        // Create terrain material
        const material = new THREE.MeshStandardMaterial({
            color: 0x4CAF50,
            roughness: 0.8,
            metalness: 0.2,
        });
        
        // Create mesh and add to scene
        this.terrain = new THREE.Mesh(geometry, material);
        this.terrain.rotation.x = -Math.PI / 2; // Rotate to horizontal
        this.terrain.receiveShadow = true;
        
        this.scene.add(this.terrain);
        
        // Try to load a texture for better appearance
        // First try local texture, then fallback to online version
        const textureUrl = 'assets/textures/grass.jpg';
        const fallbackTextureUrl = 'https://threejs.org/examples/textures/terrain/grasslight-big.jpg';
        const normalMapUrl = 'https://threejs.org/examples/textures/terrain/grasslight-big-nm.jpg';
        
        const textureLoader = new THREE.TextureLoader(this.loadingManager.getManager());
        textureLoader.load(textureUrl, 
            // Success callback
            (texture) => {
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.set(100, 100);
                
                // Update the material with the texture
                material.map = texture;
                material.needsUpdate = true;
                
                // Load normal map for more detail
                textureLoader.load(normalMapUrl, (normalMap) => {
                    normalMap.wrapS = THREE.RepeatWrapping;
                    normalMap.wrapT = THREE.RepeatWrapping;
                    normalMap.repeat.set(100, 100);
                    
                    material.normalMap = normalMap;
                    material.normalScale.set(1, 1);
                    material.needsUpdate = true;
                });
            },
            // Progress callback
            undefined,
            // Error callback - try fallback texture
            () => {
                console.log("Using fallback grass texture");
                textureLoader.load(fallbackTextureUrl, (texture) => {
                    texture.wrapS = THREE.RepeatWrapping;
                    texture.wrapT = THREE.RepeatWrapping;
                    texture.repeat.set(100, 100);
                    
                    // Update the material with the texture
                    material.map = texture;
                    material.needsUpdate = true;
                });
            }
        );
    }
    
    private createRoad(): void {
        // Create a long road running through the terrain
        const roadGeometry = new THREE.PlaneGeometry(
            this.roadWidth, 
            this.terrainSize, 
            10, 
            this.terrainSegments
        );
        
        // Create road material with asphalt texture
        const roadMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.8,
            metalness: 0.1,
        });
        
        // Load road textures - try local first, then fallback to online
        const asphaltUrl = 'assets/textures/asphalt.jpg';
        const fallbackAsphaltUrl = 'https://threejs.org/examples/textures/asphalt.jpg';
        const textureLoader = new THREE.TextureLoader(this.loadingManager.getManager());
        
        textureLoader.load(asphaltUrl, 
            // Success callback
            (texture) => {
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.set(1, 200);
                
                roadMaterial.map = texture;
                roadMaterial.needsUpdate = true;
            },
            // Progress callback 
            undefined,
            // Error callback - try fallback
            () => {
                console.log("Using fallback asphalt texture");
                textureLoader.load(fallbackAsphaltUrl, (texture) => {
                    texture.wrapS = THREE.RepeatWrapping;
                    texture.wrapT = THREE.RepeatWrapping;
                    texture.repeat.set(1, 200);
                    
                    roadMaterial.map = texture;
                    roadMaterial.needsUpdate = true;
                });
            }
        );
        
        // Create road mesh
        this.roadMesh = new THREE.Mesh(roadGeometry, roadMaterial);
        this.roadMesh.rotation.x = -Math.PI / 2;
        this.roadMesh.position.y = 0.05; // Slightly above terrain to prevent z-fighting
        this.roadMesh.receiveShadow = true;
        
        this.scene.add(this.roadMesh);
        
        // Add lane markings
        this.addRoadMarkings();
    }
    
    private addRoadMarkings(): void {
        // Center dividing line
        const centerLineGeometry = new THREE.PlaneGeometry(0.3, this.terrainSize);
        const linesMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
        const centerLine = new THREE.Mesh(centerLineGeometry, linesMaterial);
        centerLine.rotation.x = -Math.PI / 2;
        centerLine.position.y = 0.1; // Just above road
        
        this.scene.add(centerLine);
        
        // Edge lines (shoulders)
        const leftShoulderGeometry = new THREE.PlaneGeometry(0.15, this.terrainSize);
        const leftShoulder = new THREE.Mesh(leftShoulderGeometry, linesMaterial);
        leftShoulder.rotation.x = -Math.PI / 2;
        leftShoulder.position.y = 0.1;
        leftShoulder.position.x = -this.roadWidth / 2 + 0.5;
        
        const rightShoulderGeometry = new THREE.PlaneGeometry(0.15, this.terrainSize);
        const rightShoulder = new THREE.Mesh(rightShoulderGeometry, linesMaterial);
        rightShoulder.rotation.x = -Math.PI / 2;
        rightShoulder.position.y = 0.1;
        rightShoulder.position.x = this.roadWidth / 2 - 0.5;
        
        this.scene.add(leftShoulder);
        this.scene.add(rightShoulder);
        
        // Dashed lines for lane divisions if road is wide enough
        if (this.roadWidth > 10) {
            const dashCount = Math.floor(this.terrainSize / 10);
            const dashGroup = new THREE.Group();
            
            for (let i = 0; i < dashCount; i++) {
                // Only create a dash every other position (for dashed effect)
                if (i % 2 === 0) {
                    const dashGeometry = new THREE.PlaneGeometry(0.15, 3);
                    const dash = new THREE.Mesh(dashGeometry, linesMaterial);
                    dash.rotation.x = -Math.PI / 2;
                    dash.position.z = -this.terrainSize/2 + i * 10 + 5;
                    dash.position.y = 0.1;
                    dash.position.x = -this.roadWidth / 4; // Quarter way from center (for a 4-lane road)
                    
                    dashGroup.add(dash);
                    
                    // Add symmetric dash on the other side if it's a 4-lane road
                    if (this.roadWidth > 15) {
                        const dashRight = dash.clone();
                        dashRight.position.x = this.roadWidth / 4;
                        dashGroup.add(dashRight);
                    }
                }
            }
            
            this.scene.add(dashGroup);
        }
    }
    
    private createTrees(count: number): void {
        // Create tree geometry (simplified cylinder + cone)
        const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 2.5, 8);
        const leavesGeometry = new THREE.ConeGeometry(2, 5, 8);
        
        // Create materials with proper colors instead of textures that may be missing
        const trunkMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513,  // Brown color for trunk
            roughness: 0.9,
            metalness: 0.1
        });
        
        const leavesMaterial = new THREE.MeshStandardMaterial({
            color: 0x2D4F2D,  // Dark green for leaves
            roughness: 0.8,
            metalness: 0.1
        });
        
        // Try to load textures for better appearance
        const barkTextureUrl = 'assets/textures/bark.jpg';
        const leavesTextureUrl = 'assets/textures/leaves.jpg';
        const textureLoader = new THREE.TextureLoader(this.loadingManager.getManager());
        
        // Try to load bark texture with error handling
        textureLoader.load(barkTextureUrl, 
            (texture) => {
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                trunkMaterial.map = texture;
                trunkMaterial.needsUpdate = true;
            },
            undefined,
            (error) => {
                // Just use the color material if texture fails to load
                console.log("Could not load bark texture, using color instead");
            }
        );
        
        // Try to load leaves texture with error handling
        textureLoader.load(leavesTextureUrl, 
            (texture) => {
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                leavesMaterial.map = texture;
                leavesMaterial.needsUpdate = true;
            },
            undefined,
            (error) => {
                // Just use the color material if texture fails to load
                console.log("Could not load leaves texture, using color instead");
            }
        );
        
        // Use instance mesh for performance
        this.trees = new THREE.Group();
        
        // Create template tree
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        trunk.position.y = 1.25; // Half of trunk height
        
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.castShadow = true;
        leaves.receiveShadow = true;
        leaves.position.y = 5; // Place on top of trunk
        
        // Create tree template
        const treeTemplate = new THREE.Group();
        treeTemplate.add(trunk);
        treeTemplate.add(leaves);
        
        // For each tree...
        for (let i = 0; i < count; i++) {
            // Clone the template
            const tree = treeTemplate.clone();
            
            // Random position
            const angle = Math.random() * Math.PI * 2;
            const distance = 50 + Math.random() * 800;
            
            const x = Math.sin(angle) * distance;
            const z = Math.cos(angle) * distance * 2;
            
            // Skip if too close to the road
            const distanceFromRoad = Math.abs(x);
            if (distanceFromRoad < this.roadWidth * 3) {
                continue;
            }
            
            // Get height at this position
            const y = this.getHeightAt(x, z);
            
            // Skip positions that are too high or too low
            if (y > 80 || y < -20) {
                continue;
            }
            
            // Position tree on terrain
            tree.position.set(x, y, z);
            
            // Random rotation
            tree.rotation.y = Math.random() * Math.PI * 2;
            
            // Random scale for variety
            const scale = 0.8 + Math.random() * 1.5;
            tree.scale.set(scale, scale, scale);
            
            // Add to group
            this.trees.add(tree);
        }
        
        // Add all trees to scene
        this.scene.add(this.trees);
    }
    
    private createGrassPatches(count: number): void {
        // Create a simple grass patch using a custom geometry
        const grassGeometry = new THREE.PlaneGeometry(3, 3, 1, 1);
        grassGeometry.rotateX(-Math.PI / 2); // Lay flat on the ground
        
        // Green material for grass
        const grassMaterial = new THREE.MeshStandardMaterial({
            color: 0x3e8948,
            roughness: 0.8,
            metalness: 0.1,
            side: THREE.DoubleSide
        });
        
        // Use instanced mesh for better performance
        this.grassPatches = new THREE.InstancedMesh(grassGeometry, grassMaterial, count);
        this.grassPatches.castShadow = true;
        this.grassPatches.receiveShadow = true;
        
        // Temporary matrix and object for setting up instances
        const matrix = new THREE.Matrix4();
        const dummy = new THREE.Object3D();
        
        // Place grass patches randomly
        for (let i = 0; i < count; i++) {
            // Random position
            const angle = Math.random() * Math.PI * 2;
            const distance = 20 + Math.random() * 800;
            
            const x = Math.sin(angle) * distance;
            const z = Math.cos(angle) * distance * 2;
            
            // Skip if too close to the road
            const distanceFromRoad = Math.abs(x);
            if (distanceFromRoad < this.roadWidth * 2) {
                continue;
            }
            
            // Get height at this position
            const y = this.getHeightAt(x, z);
            
            // Skip positions that are too high or too low
            if (y > 80 || y < -20) {
                continue;
            }
            
            // Position grass on terrain
            dummy.position.set(x, y + 0.01, z); // Slightly above ground to prevent z-fighting
            
            // Random rotation
            dummy.rotation.y = Math.random() * Math.PI * 2;
            
            // Random scale for variety
            const scale = 0.5 + Math.random() * 2;
            dummy.scale.set(scale, 1, scale);
            
            dummy.updateMatrix();
            this.grassPatches.setMatrixAt(i, dummy.matrix);
        }
        
        // Update the instance matrix
        if (this.grassPatches.instanceMatrix) {
            this.grassPatches.instanceMatrix.needsUpdate = true;
        }
        
        this.scene.add(this.grassPatches);
    }
    
    private createRocks(count: number): void {
        // Create rock shapes
        const rockGeometries = [
            new THREE.DodecahedronGeometry(1, 0),   // Basic rock shape
            new THREE.DodecahedronGeometry(1, 1),   // Slightly more detailed
            new THREE.DodecahedronGeometry(0.8, 0)  // Smaller rock
        ];
        
        // Stone material with gray color
        const rockMaterial = new THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.9,
            metalness: 0.1
        });
        
        // Create instanced mesh for rocks
        this.rocks = new THREE.InstancedMesh(
            rockGeometries[0], // Use first geometry as base
            rockMaterial,
            count
        );
        
        // Temporary objects for setting up instances
        const matrix = new THREE.Matrix4();
        const dummy = new THREE.Object3D();
        
        // Place rocks randomly avoiding the road
        for (let i = 0; i < count; i++) {
            // Random position
            const angle = Math.random() * Math.PI * 2;
            const distance = 50 + Math.random() * 800;
            
            const x = Math.sin(angle) * distance;
            const z = Math.cos(angle) * distance * 2;
            
            // Skip if too close to the road
            const distanceFromRoad = Math.abs(x);
            if (distanceFromRoad < this.roadWidth * 3) {
                continue;
            }
            
            // Get height at this position
            const y = this.getHeightAt(x, z);
            
            // Skip positions that are too high or too low
            if (y > 80 || y < -20) {
                continue;
            }
            
            // Position rock on terrain
            dummy.position.set(x, y, z);
            
            // Random rotation
            dummy.rotation.set(
                Math.random() * Math.PI / 4,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI / 4
            );
            
            // Random scale for variety (smaller than trees)
            const scale = 0.5 + Math.random() * 2;
            dummy.scale.set(scale, scale, scale);
            
            dummy.updateMatrix();
            this.rocks.setMatrixAt(i, dummy.matrix);
        }
        
        // Update the instanced mesh
        if (this.rocks.instanceMatrix) {
            this.rocks.instanceMatrix.needsUpdate = true;
        }
        
        this.scene.add(this.rocks);
    }
    
    private updateTerrainChunks(): void {
        // This method would manage terrain chunks based on player position
        // For now it's a placeholder since we're using a single terrain mesh
        console.log('Updating terrain chunks near:', this.playerPosition);
    }
    
    private getHeightAt(x: number, z: number): number {
        // Calculate terrain height at given position using our noise function
        let height = 0;
        
        // First octave - general terrain shape
        height += this.noise.noise(x * 0.002, 0, z * 0.002) * 50;
        
        // Second octave - medium details
        height += this.noise.noise(x * 0.01, 0, z * 0.01) * 20;
        
        // Third octave - small details
        height += this.noise.noise(x * 0.05, 0, z * 0.05) * 5;
        
        // Apply road flattening (if near the road)
        const distanceFromRoad = Math.abs(x);
        if (distanceFromRoad <= this.roadWidth / 2) {
            // On the road - flat
            return 0;
        } else if (distanceFromRoad < this.roadWidth / 2 + this.roadWidth * 2) {
            // Transition zone
            const transitionWidth = this.roadWidth * 2;
            const roadProximity = Math.max(0, 1 - ((distanceFromRoad - this.roadWidth/2) / transitionWidth));
            return height * (1 - Math.pow(roadProximity, 2));
        }
        
        return height;
    }
} 