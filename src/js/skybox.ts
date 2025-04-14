import * as THREE from 'three';
import { LoadingManager } from './loading-manager';

export class SkyBox {
    private scene: THREE.Scene;
    private loadingManager: LoadingManager;
    private skybox: THREE.Mesh | null = null;
    private clouds: THREE.Mesh[] = [];
    private sun: THREE.Mesh | null = null;
    private sunLight: THREE.DirectionalLight | null = null;
    private time: number = 0;
    
    constructor(scene: THREE.Scene, loadingManager: LoadingManager) {
        this.scene = scene;
        this.loadingManager = loadingManager;
        
        this.createSkyBox();
    }
    
    public update(delta: number): void {
        // Animate clouds with varied movement
        this.clouds.forEach((cloud) => {
            const speed = cloud.userData?.speed || 0.2;
            const rotationSpeed = cloud.userData?.rotationSpeed || 0;
            
            cloud.position.x += delta * speed * 5; // Faster movement
            cloud.rotation.z += delta * rotationSpeed;
            
            // Reset position if cloud moves too far
            if (cloud.position.x > 2000) {
                cloud.position.x = -2000;
                // Randomize height when recycling
                cloud.position.y = 200 + Math.random() * 300;
            }
        });
        
        // Animate sun position for day/night cycle (very slow)
        this.time += delta * 0.02;
        if (this.sun && this.sunLight) {
            // Calculate sun position on a circular path
            const radius = 1800;
            const sunAngle = this.time % (Math.PI * 2);
            
            // Sun moves in a circle in the y-z plane
            this.sun.position.y = Math.sin(sunAngle) * radius * 0.5 + 400;
            this.sun.position.z = Math.cos(sunAngle) * radius;
            
            // Update light position to match sun
            this.sunLight.position.copy(this.sun.position);
            
            // Adjust light intensity based on sun height (day/night cycle)
            const normalizedHeight = (this.sun.position.y + 400) / 800;
            this.sunLight.intensity = Math.max(0.5, normalizedHeight * 2.5);
            
            // Change fog density based on time of day
            if (this.scene.fog) {
                const fogDensity = 0.0005 + (1 - normalizedHeight) * 0.002;
                (this.scene.fog as THREE.FogExp2).density = fogDensity;
            }
        }
    }
    
    private createSkyBox(): void {
        // Try loading high quality skybox textures from slowroads-style environment
        const cubeTextureLoader = new THREE.CubeTextureLoader();
        
        // Use threejs.org texture paths
        cubeTextureLoader.setPath('https://threejs.org/examples/textures/cube/Park3Med/');
        
        // Load the six sides of the cube texture
        const cubeTexture = cubeTextureLoader.load([
            'px.jpg', 'nx.jpg',
            'py.jpg', 'ny.jpg',
            'pz.jpg', 'nz.jpg'
        ]);
        
        // Set the scene's background to the cube texture
        this.scene.background = cubeTexture;
        
        // Set environment map for reflections on shiny objects
        this.scene.environment = cubeTexture;
        
        // Add sun and clouds for added realism
        this.addSun();
        this.addClouds();
        
        // Add fog for depth and atmosphere
        this.scene.fog = new THREE.FogExp2(0xC5D9EA, 0.0015);
    }
    
    private addSun(): void {
        // Create a sun light source
        const sunLight = new THREE.DirectionalLight(0xFFF5DD, 2.0); // Warmer and brighter
        sunLight.position.set(-100, 200, -100); // Higher in the sky
        sunLight.castShadow = true;
        this.sunLight = sunLight;
        
        // Improve shadow quality
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 800; // Increased range
        sunLight.shadow.camera.left = -400;
        sunLight.shadow.camera.right = 400;
        sunLight.shadow.camera.top = 400;
        sunLight.shadow.camera.bottom = -400;
        
        // Add a secondary light from opposite direction to soften shadows
        const secondaryLight = new THREE.DirectionalLight(0xCBE5FF, 1.0); // Blue-ish light like sky
        secondaryLight.position.set(100, 50, 100);
        
        this.scene.add(sunLight);
        this.scene.add(secondaryLight);
        
        // Create a larger, warmer sun for a better visual
        const sunGeometry = new THREE.SphereGeometry(30, 32, 32);
        const sunMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffee00,
            transparent: true,
            opacity: 0.9
        });
        
        const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
        this.sun = sunMesh;
        
        // Position the sun higher and farther
        sunMesh.position.set(-800, 400, -1000);
        
        // Add a glow sphere around the sun
        const glowGeometry = new THREE.SphereGeometry(45, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xff9900,
            transparent: true,
            opacity: 0.4,
            side: THREE.BackSide
        });
        
        const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        sunMesh.add(glowMesh);
        
        this.scene.add(sunMesh);
    }
    
    private addClouds(): void {
        // Create more realistic cloud system with different sizes and heights
        const cloudCount = 60; // More clouds
        // Try local cloud texture first, then fallback to online
        const cloudUrl = 'assets/textures/clouds.jpg';
        const fallbackCloudUrl = 'https://threejs.org/examples/textures/clouds.jpg';
        
        const textureLoader = new THREE.TextureLoader(this.loadingManager.getManager());
        textureLoader.load(cloudUrl, 
            // Success callback
            (cloudTexture) => {
                this.createCloudsWithTexture(cloudTexture, cloudCount);
            },
            // Progress callback
            undefined,
            // Error callback - try fallback
            () => {
                console.log("Using fallback cloud texture");
                textureLoader.load(fallbackCloudUrl, 
                    (cloudTexture) => {
                        this.createCloudsWithTexture(cloudTexture, cloudCount);
                    },
                    undefined,
                    (error) => {
                        console.log("Could not load cloud texture, using basic clouds");
                        // Create basic clouds with no texture as last resort
                        this.createBasicClouds(cloudCount);
                    }
                );
            }
        );
    }
    
    private createCloudsWithTexture(cloudTexture: THREE.Texture, cloudCount: number): void {
        cloudTexture.wrapS = THREE.RepeatWrapping;
        cloudTexture.wrapT = THREE.RepeatWrapping;
        
        // Create two different cloud materials for variety
        const cloudMaterialLight = new THREE.MeshStandardMaterial({
            map: cloudTexture,
            transparent: true,
            opacity: 0.9,
            color: 0xffffff,
            side: THREE.DoubleSide
        });
        
        const cloudMaterialDark = new THREE.MeshStandardMaterial({
            map: cloudTexture,
            transparent: true,
            opacity: 0.7,
            color: 0xdddddd, // Slightly darker for shadow clouds
            side: THREE.DoubleSide
        });
        
        // Create large cloud layer
        for (let i = 0; i < cloudCount; i++) {
            const isLightCloud = Math.random() > 0.3;
            const cloudSize = 300 + Math.random() * 700;
            const cloudGeometry = new THREE.PlaneGeometry(cloudSize, cloudSize);
            const cloudMaterial = isLightCloud ? cloudMaterialLight.clone() : cloudMaterialDark.clone();
            const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
            
            // Random position
            const angle = Math.random() * Math.PI * 2;
            const radius = 500 + Math.random() * 2000;
            cloud.position.x = Math.sin(angle) * radius;
            cloud.position.z = Math.cos(angle) * radius;
            cloud.position.y = 200 + Math.random() * 300;
            
            // Random rotation
            cloud.rotation.x = -Math.PI / 2;
            cloud.rotation.z = Math.random() * Math.PI * 2;
            
            // Random speed
            cloud.userData = { 
                speed: 0.1 + Math.random() * 0.3,
                rotationSpeed: (Math.random() - 0.5) * 0.01
            };
            
            this.scene.add(cloud);
            this.clouds.push(cloud);
        }
    }
    
    private createBasicClouds(cloudCount: number): void {
        // Create basic clouds with no texture
        const cloudMaterial = new THREE.MeshStandardMaterial({
            transparent: true,
            opacity: 0.7,
            color: 0xffffff,
            side: THREE.DoubleSide
        });
        
        for (let i = 0; i < cloudCount; i++) {
            const cloudSize = 300 + Math.random() * 700;
            const cloudGeometry = new THREE.PlaneGeometry(cloudSize, cloudSize);
            const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
            
            // Random position
            const angle = Math.random() * Math.PI * 2;
            const radius = 500 + Math.random() * 2000;
            cloud.position.x = Math.sin(angle) * radius;
            cloud.position.z = Math.cos(angle) * radius;
            cloud.position.y = 200 + Math.random() * 300;
            
            // Random rotation
            cloud.rotation.x = -Math.PI / 2;
            cloud.rotation.z = Math.random() * Math.PI * 2;
            
            // Random speed
            cloud.userData = { 
                speed: 0.1 + Math.random() * 0.3,
                rotationSpeed: (Math.random() - 0.5) * 0.01
            };
            
            this.scene.add(cloud);
            this.clouds.push(cloud);
        }
    }
} 