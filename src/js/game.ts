import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { Vehicle } from './vehicle';
import { Terrain } from './terrain';
import { SkyBox } from './skybox';
import { LoadingManager } from './loading-manager';

export class Game {
    // Three.js components
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private clock: THREE.Clock;
    private loadingManager: LoadingManager;
    private composer: EffectComposer | null = null;

    // Game objects
    private vehicle: Vehicle | null = null;
    private terrain: Terrain | null = null;
    private skybox: SkyBox | null = null;

    // Game state
    private running: boolean = false;
    private inputKeys: { [key: string]: boolean } = {};
    private quality: string = 'medium';
    private volume: number = 0.5;
    private selectedCarModel: string = 'porsche';
    private selectedBackgroundMusic: string = 'classical';
    private backgroundMusic: HTMLAudioElement | null = null;

    constructor(loadingManager: LoadingManager) {
        console.log('Game constructor called');
        this.loadingManager = loadingManager;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            10000
        );
        
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        
        this.clock = new THREE.Clock();
        
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        
        // Add renderer to document
        const gameContainer = document.getElementById('game-container');
        console.log('Game container found:', !!gameContainer);
        
        if (gameContainer) {
            gameContainer.appendChild(this.renderer.domElement);
        } else {
            console.error('Game container not found! Adding to body instead.');
            document.body.appendChild(this.renderer.domElement);
        }
        
        // Setup event listeners
        window.addEventListener('resize', this.onWindowResize.bind(this));
        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('keyup', this.onKeyUp.bind(this));
    }

    public init(): void {
        console.log('Game init called');
        try {
            // Always use highest quality for best visuals
            this.quality = 'high';
            
            // Initialize skybox first
            console.log('Initializing skybox');
            this.skybox = new SkyBox(this.scene, this.loadingManager);
            
            // Initialize vehicle before terrain so it's properly positioned
            console.log(`Initializing vehicle with default model`);
            this.vehicle = new Vehicle(this.scene, this.loadingManager);
            
            // Initialize terrain last
            console.log('Initializing terrain');
            this.terrain = new Terrain(this.scene, this.loadingManager);
            
            // Position the camera with better angle for viewing the car
            this.camera.position.set(0, 5, -10);
            this.camera.lookAt(0, 1, 0);
            
            // Add ambient light with increased intensity for better vehicle visibility
            const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
            this.scene.add(ambientLight);
            
            // Add directional light (sun) with better color
            const directionalLight = new THREE.DirectionalLight(0xffffee, 1.5);
            directionalLight.position.set(100, 100, 50);
            directionalLight.castShadow = true;
            directionalLight.shadow.mapSize.width = 2048;
            directionalLight.shadow.mapSize.height = 2048;
            directionalLight.shadow.camera.near = 0.5;
            directionalLight.shadow.camera.far = 500;
            directionalLight.shadow.camera.left = -100;
            directionalLight.shadow.camera.right = 100;
            directionalLight.shadow.camera.top = 100;
            directionalLight.shadow.camera.bottom = -100;
            this.scene.add(directionalLight);
            
            // Initialize post processing with enhanced bloom for car paint
            this.setupPostProcessing();
            
            // Apply quality settings
            this.applyQualitySettings();
            console.log('Game initialization complete');
        } catch (error) {
            console.error('Error during game initialization:', error);
        }
    }

    public start(): void {
        this.running = true;
        this.clock.start();
        
        // Load selected car model if it's not the default
        if (this.vehicle && this.selectedCarModel) {
            this.vehicle.loadModelByName(this.selectedCarModel);
        }
        
        // Start background music
        this.loadBackgroundMusic();
        
        // Start animation loop
        this.animate();
    }

    public pause(): void {
        this.running = false;
    }

    public resume(): void {
        if (!this.running) {
            this.running = true;
            this.animate();
        }
    }

    public setQuality(quality: string): void {
        this.quality = quality;
        this.applyQualitySettings();
    }

    public setVolume(volume: number): void {
        this.volume = volume;
        // Apply volume settings to audio elements
        if (this.vehicle) {
            this.vehicle.setVolume(volume);
        }
        
        // Also apply to background music if playing
        if (this.backgroundMusic) {
            this.backgroundMusic.volume = volume;
        }
    }

    public setCarModel(model: string): void {
        this.selectedCarModel = model;
        console.log(`Car model set to: ${model}`);
        
        // If vehicle already exists, update its model
        if (this.vehicle) {
            this.vehicle.loadModelByName(model);
        }
    }
    
    public setBackgroundMusic(music: string): void {
        this.selectedBackgroundMusic = music;
        console.log(`Background music set to: ${music}`);
        
        // Stop current music if playing
        if (this.backgroundMusic) {
            this.backgroundMusic.pause();
            this.backgroundMusic = null;
        }
        
        // Load and play the selected music
        this.loadBackgroundMusic();
    }
    
    private loadBackgroundMusic(): void {
        let musicPath = '';
        
        // Map music selection to file path
        if (this.selectedBackgroundMusic === 'wind') {
            musicPath = 'assets/audio/soft-wind-318856.mp3';
        } else if (this.selectedBackgroundMusic === 'motor') {
            musicPath = 'assets/audio/motor-loop-83480.mp3';
        } else {
            // Default fallback
            musicPath = 'assets/audio/soft-wind-318856.mp3';
        }
        
        console.log('LOADING AUDIO FROM ASSETS DIRECTORY:', musicPath);
        
        // Stop any existing audio
        if (this.backgroundMusic) {
            this.backgroundMusic.pause();
            this.backgroundMusic = null;
        }
        
        // Create and configure audio element
        this.backgroundMusic = new Audio(musicPath);
        this.backgroundMusic.loop = true;
        this.backgroundMusic.volume = this.volume;
        
        // Add error handling
        this.backgroundMusic.onerror = (e) => {
            console.error('Failed to load audio file:', musicPath, e);
        };
        
        // Add success notification
        this.backgroundMusic.oncanplaythrough = () => {
            console.log(`Successfully loaded audio: ${musicPath}`);
        };
        
        // Play the music (with user interaction)
        this.backgroundMusic.play().catch(err => {
            console.error('Error playing background music:', err);
            console.log('Audio needs user interaction first - click on the page to enable sound');
        });
    }

    private animate(): void {
        if (!this.running) return;
        
        requestAnimationFrame(this.animate.bind(this));
        
        const delta = this.clock.getDelta();
        
        // Only log once every 60 frames to reduce spam
        const shouldLog = Math.random() < 0.016; // ~1/60 chance
        
        if (shouldLog) {
            console.log(`Frame delta: ${delta.toFixed(4)}s`);
            
            // Log active keys
            const activeKeys = Object.keys(this.inputKeys).filter(key => this.inputKeys[key]);
            if (activeKeys.length > 0) {
                console.log('Active keys:', activeKeys);
            }
        }
        
        // Update game objects
        if (this.vehicle) {
            // Pass the input keys to the vehicle
            this.vehicle.update(delta, this.inputKeys);
            
            // Update camera position to follow the vehicle
            if (this.vehicle.getObject()) {
                const vehiclePosition = this.vehicle.getPosition(); // Use position from vehicle
                const vehicleRotation = this.vehicle.getObject().rotation;
                
                // Calculate camera position behind the vehicle
                // Adjusted for the Sports car model
                const cameraOffset = new THREE.Vector3(
                    -Math.sin(vehicleRotation.y) * 8,  // Further back for better view
                    4,                                 // Higher camera height
                    -Math.cos(vehicleRotation.y) * 8   // Further follow distance
                );
                
                this.camera.position.lerp(
                    new THREE.Vector3(
                        vehiclePosition.x + cameraOffset.x,
                        vehiclePosition.y + cameraOffset.y,
                        vehiclePosition.z + cameraOffset.z
                    ),
                    0.05 // Smoother camera follow
                );
                
                // Make camera look at the Sports car (slightly higher)
                const lookAtPosition = new THREE.Vector3(
                    vehiclePosition.x,
                    vehiclePosition.y + 1.5, // Look at the car's roof
                    vehiclePosition.z
                );
                
                this.camera.lookAt(lookAtPosition);
                
                // Only log occasionally
                if (shouldLog) {
                    console.log(`Vehicle position: (${vehiclePosition.x.toFixed(2)}, ${vehiclePosition.y.toFixed(2)}, ${vehiclePosition.z.toFixed(2)})`);
                    console.log(`Vehicle speed: ${this.vehicle.getSpeed().toFixed(2)} km/h`);
                }
                
                // Update terrain based on vehicle position
                if (this.terrain) {
                    this.terrain.updatePlayerPosition(vehiclePosition);
                }
            }
        }
        
        // Update terrain
        if (this.terrain) {
            this.terrain.update(delta);
        }
        
        // Update skybox animations
        if (this.skybox) {
            this.skybox.update(delta);
        }
        
        // Render scene with post-processing if available
        if (this.composer) {
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }

    private onWindowResize(): void {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        // Update postprocessing on resize
        if (this.composer) {
            this.composer.setSize(window.innerWidth, window.innerHeight);
            
            // Also update FXAA resolution
            const fxaaPass = this.composer.passes.find(
                pass => (pass as any).material?.uniforms?.resolution !== undefined
            );
            
            if (fxaaPass) {
                (fxaaPass as any).material.uniforms['resolution'].value.x = 1 / window.innerWidth;
                (fxaaPass as any).material.uniforms['resolution'].value.y = 1 / window.innerHeight;
            }
        }
    }

    private onKeyDown(event: KeyboardEvent): void {
        // Track key state (always store lowercase for consistency)
        const key = event.key.toLowerCase();
        
        // Don't process repeated key events (key held down)
        if (this.inputKeys[key]) return;
        
        this.inputKeys[key] = true;
        
        // For arrow keys, also set alternative friendly names
        if (event.key === 'ArrowUp') {
            this.inputKeys['up'] = true;
        } else if (event.key === 'ArrowDown') {
            this.inputKeys['down'] = true;
        } else if (event.key === 'ArrowLeft') {
            this.inputKeys['left'] = true;
        } else if (event.key === 'ArrowRight') {
            this.inputKeys['right'] = true;
        }
        
        // Handle ESC key for menu
        if (key === 'escape') {
            const menu = document.getElementById('menu');
            menu?.classList.toggle('hidden');
            
            if (menu?.classList.contains('hidden')) {
                this.resume();
            } else {
                this.pause();
            }
        }
        
        // Handle reset with R key
        if (key === 'r') {
            if (this.vehicle) {
                this.vehicle.reset();
            }
        }
        
        console.log('Key down:', event.key, '(stored as:', key, ') Keys currently pressed:', Object.keys(this.inputKeys).filter(k => this.inputKeys[k]));
    }

    private onKeyUp(event: KeyboardEvent): void {
        // Release key state (always store lowercase for consistency)
        const key = event.key.toLowerCase();
        this.inputKeys[key] = false;
        
        // For arrow keys, also clear alternative friendly names
        if (event.key === 'ArrowUp') {
            this.inputKeys['up'] = false;
        } else if (event.key === 'ArrowDown') {
            this.inputKeys['down'] = false;
        } else if (event.key === 'ArrowLeft') {
            this.inputKeys['left'] = false;
        } else if (event.key === 'ArrowRight') {
            this.inputKeys['right'] = false;
        }
        
        console.log('Key up:', event.key, '(stored as:', key, ')');
    }

    private setupPostProcessing(): void {
        // Create the effect composer
        this.composer = new EffectComposer(this.renderer);
        
        // Add render pass
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        
        // Add bloom effect specifically tuned for car paint reflection
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.8,  // bloom strength - increased to highlight car paint
            0.5,  // bloom radius
            0.35  // bloom threshold - lowered to catch car reflections better
        );
        this.composer.addPass(bloomPass);
        
        // Add anti-aliasing
        const fxaaPass = new ShaderPass(FXAAShader);
        fxaaPass.material.uniforms['resolution'].value.x = 1 / window.innerWidth;
        fxaaPass.material.uniforms['resolution'].value.y = 1 / window.innerHeight;
        this.composer.addPass(fxaaPass);
    }

    private applyQualitySettings(): void {
        // Force high quality for all settings to showcase Porsche model
        this.quality = 'high';
        
        // Apply based on quality setting
        switch (this.quality) {
            case 'low':
                this.renderer.setPixelRatio(1);
                this.renderer.shadowMap.enabled = false;
                
                // Disable post-processing for low quality
                if (this.composer) {
                    // Remove bloom pass to improve performance
                    this.composer.passes = this.composer.passes.filter(
                        pass => !(pass instanceof UnrealBloomPass)
                    );
                }
                break;
                
            case 'medium':
                this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
                this.renderer.shadowMap.enabled = true;
                this.renderer.shadowMap.type = THREE.PCFShadowMap;
                
                // Use less intense bloom for medium quality
                if (this.composer) {
                    const bloomPass = this.composer.passes.find(
                        pass => pass instanceof UnrealBloomPass
                    ) as UnrealBloomPass;
                    
                    if (bloomPass) {
                        bloomPass.strength = 0.5;
                        bloomPass.radius = 0.5;
                        bloomPass.threshold = 0.75;
                    }
                }
                break;
                
            case 'high':
                this.renderer.setPixelRatio(window.devicePixelRatio);
                this.renderer.shadowMap.enabled = true;
                this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
                
                // Enhanced post-processing for car showcase
                if (this.composer) {
                    const bloomPass = this.composer.passes.find(
                        pass => pass instanceof UnrealBloomPass
                    ) as UnrealBloomPass;
                    
                    if (bloomPass) {
                        bloomPass.strength = 1.0; // Stronger bloom for car paint
                        bloomPass.radius = 0.5;
                        bloomPass.threshold = 0.35; // Lower threshold to catch more reflections
                    }
                }
                
                // Force high quality - always use maximum pixel ratio for best visuals
                this.renderer.setPixelRatio(Math.max(2, window.devicePixelRatio));
                break;
        }
        
        // Update terrain quality
        if (this.terrain) {
            this.terrain.setQuality(this.quality);
        }
        
        // Update vehicle quality
        if (this.vehicle) {
            this.vehicle.setQuality(this.quality);
        }
    }

    public getVehicle(): Vehicle | null {
        return this.vehicle;
    }

    public getInputKeys(): { [key: string]: boolean } {
        return this.inputKeys;
    }
} 