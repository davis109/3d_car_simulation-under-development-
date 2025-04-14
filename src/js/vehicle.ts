import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { LoadingManager } from './loading-manager';

export class Vehicle {
    private scene: THREE.Scene;
    private model: THREE.Group;
    private loader: GLTFLoader;
    private dracoLoader: DRACOLoader;
    private tempModel: THREE.Group;
    private loadingManager: LoadingManager;
    
    // Audio properties
    private audioContext: AudioContext | null = null;
    private engineSound: HTMLAudioElement | null = null;
    private engineVolume: number = 0.5;
    
    // Physics properties
    private position: THREE.Vector3;
    private rotation: number = 0;
    private velocity: number = 0;
    private speed: number = 0;
    private acceleration: number = 0;
    private maxSpeed: number = 200;
    private steeringAngle: number = 0;
    private maxSteeringAngle: number = Math.PI / 4;
    private wheelBase: number = 2.5;
    private gravity: number = 9.81;
    private drag: number = 0.01;
    private braking: number = 0;
    private isBraking: boolean = false;
    private quality: string = 'high';
    
    constructor(scene: THREE.Scene, loadingManager: LoadingManager) {
        this.scene = scene;
        this.loadingManager = loadingManager;
        this.position = new THREE.Vector3(0, 0, 0);
        this.model = new THREE.Group();
        
        // Initialize DRACOLoader
        this.dracoLoader = new DRACOLoader();
        this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.5/');
        
        // Create loader using the THREE.LoadingManager from our custom LoadingManager
        this.loader = new GLTFLoader(this.loadingManager.getManager());
        this.loader.setDRACOLoader(this.dracoLoader);
        
        // Create temporary model while the actual model loads
        this.tempModel = this.createPlaceholderVehicle();
        this.scene.add(this.tempModel);
        
        // Initialize audio after user interaction
        window.addEventListener('keydown', () => this.initAudio(), { once: true });
    }
    
    private createPlaceholderVehicle(): THREE.Group {
        const temp = new THREE.Group();
        
        // Create a simple car shape
        const bodyGeometry = new THREE.BoxGeometry(4, 1, 2);
        const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x2222ff });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.5;
        body.castShadow = true;
        temp.add(body);
        
        // Add cabin
        const cabinGeometry = new THREE.BoxGeometry(2, 0.8, 1.8);
        const cabinMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
        const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
        cabin.position.set(-0.5, 1.4, 0);
        cabin.castShadow = true;
        temp.add(cabin);
        
        return temp;
    }
    
    private loadVehicleModel(): void {
        // Log all available models
        console.log('Available models in assets/models directory:');
        console.log('- Sports.glb');
        console.log('- 2020_porsche_718_cayman_gt4.glb');
        
        // Load the default Sports car model
        const modelPath = 'assets/models/Sports.glb';
        console.log('Loading default Sports model from path:', modelPath);
        
        this.loader.load(
            modelPath,
            (gltf: GLTF) => {
                // Remove the temporary model
                this.scene.remove(this.tempModel);
                
                // Process the loaded model
                this.model = gltf.scene;
                console.log('Model loaded successfully, scene:', gltf.scene);
                
                // Enhance materials for better rendering
                this.model.traverse((child: THREE.Object3D) => {
                    if (child instanceof THREE.Mesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        
                        if (child.material) {
                            // Enhance material properties
                            if (child.material instanceof THREE.MeshStandardMaterial) {
                                child.material.envMapIntensity = 1.5;
                                child.material.needsUpdate = true;
                            }
                        }
                    }
                });
                
                // Scale and position model appropriately
                this.model.scale.set(0.8, 0.8, 0.8); // Adjust scale as needed
                this.model.rotation.y = Math.PI;
                
                this.scene.add(this.model);
                console.log('Sports car model loaded successfully and added to scene!');
            },
            (xhr) => {
                console.log(`Loading Sports model: ${(xhr.loaded / xhr.total) * 100}% loaded`);
            },
            (error) => {
                console.error('Error loading Sports model:', error);
                console.log('Keeping placeholder model due to loading error');
            }
        );
    }
    
    public initAudio(): void {
        console.log('Initializing audio for vehicle...');
        
        // Log all available audio files
        console.log('Available audio files in assets/audio directory:');
        console.log('- motor-loop-83480.mp3');
        console.log('- soft-wind-318856.mp3');
        
        // Load the engine sound file
        const audioPath = 'assets/audio/motor-loop-83480.mp3';
        console.log('Loading engine sound from absolute path:', new URL(audioPath, window.location.href).href);
        
        this.engineSound = new Audio(audioPath);
        
        if (this.engineSound) {
            // Set properties for looping engine sound
            this.engineSound.loop = true;
            this.engineSound.volume = 0;  // Start silent
            this.engineSound.playbackRate = 0.5;  // Start at idle speed
            
            // Log when audio is loaded and ready
            this.engineSound.oncanplaythrough = () => {
                console.log('Engine sound loaded and ready to play');
            };
            
            // Log if there's an error loading the audio
            this.engineSound.onerror = (e) => {
                console.error('Error loading engine sound:', e);
            };
            
            // Start playing immediately (will be silent until speed increases)
            this.engineSound.play().catch(err => {
                console.error('Error playing engine sound:', err);
            });
            
            console.log('Engine sound initialized successfully');
        }
    }
    
    private updateEngineSound(): void {
        if (!this.engineSound) return;
        
        // Calculate engine sound pitch (playback rate) based on speed
        const minRate = 0.5;  // Idle sound
        const maxRate = 1.5;  // Full throttle sound
        const speedFactor = Math.min(1, Math.abs(this.speed) / 80);
        const playbackRate = minRate + speedFactor * (maxRate - minRate);
        
        // Apply the playback rate
        this.engineSound.playbackRate = playbackRate;
        
        // Calculate volume based on speed and braking
        let volume = Math.min(this.engineVolume * 0.8, this.engineVolume * (Math.abs(this.speed) / 50));
        
        // If braking, reduce volume slightly
        if (this.isBraking && this.speed > 1) {
            volume *= 0.8;
        }
        
        // Apply the volume
        this.engineSound.volume = volume;
    }
    
    public update(deltaTime: number, inputKeys: { [key: string]: boolean }): void {
        // Process input keys to controls
        const forward = inputKeys['w'] || inputKeys['arrowup'] || inputKeys['up'] || false;
        const backward = inputKeys['s'] || inputKeys['arrowdown'] || inputKeys['down'] || false;
        const left = inputKeys['a'] || inputKeys['arrowleft'] || inputKeys['left'] || false;
        const right = inputKeys['d'] || inputKeys['arrowright'] || inputKeys['right'] || false;
        const brake = inputKeys[' '] || inputKeys['space'] || false;
        
        // Calculate acceleration based on controls
        const accelerationForce = forward ? 15 : 0;
        const brakeForce = (backward || brake) ? 30 : 0;
        
        // Update braking state
        this.braking = brakeForce;
        this.isBraking = backward || brake;
        
        // Apply acceleration/deceleration forces
        if (this.speed > 0 || accelerationForce > 0) {
            this.acceleration = accelerationForce - brakeForce - (this.drag * this.speed * this.speed);
        } else if (this.speed < 0 || brakeForce > 0) {
            this.acceleration = -brakeForce + (this.drag * this.speed * this.speed);
        } else {
            this.acceleration = 0;
        }
        
        // Update velocity and apply speed limits
        this.velocity += this.acceleration * deltaTime;
        this.speed = this.velocity;
        
        if (Math.abs(this.speed) > this.maxSpeed) {
            this.speed = Math.sign(this.speed) * this.maxSpeed;
            this.velocity = this.speed;
        }
        
        // Update steering angle
        const steeringSpeed = 2.0;
        if (left) {
            this.steeringAngle += steeringSpeed * deltaTime;
        } else if (right) {
            this.steeringAngle -= steeringSpeed * deltaTime;
        } else {
            // Return steering to center
            this.steeringAngle *= 0.9;
        }
        
        // Clamp steering angle
        this.steeringAngle = Math.max(-this.maxSteeringAngle, Math.min(this.maxSteeringAngle, this.steeringAngle));
        
        // Calculate turning radius based on steering angle
        const turningRadius = this.wheelBase / Math.sin(Math.abs(this.steeringAngle) + 1e-10);
        
        // Update rotation based on speed and steering
        const angularVelocity = this.speed / turningRadius;
        this.rotation += angularVelocity * deltaTime * Math.sign(this.steeringAngle);
        
        // Update position
        this.position.x += Math.cos(this.rotation) * this.speed * deltaTime;
        this.position.z += Math.sin(this.rotation) * this.speed * deltaTime;
        
        // Update model position and rotation
        if (this.model) {
            this.model.position.copy(this.position);
            this.model.rotation.y = this.rotation + Math.PI; // Add PI to face the correct direction
        }
        
        // Update engine sound
        this.updateEngineSound();
    }
    
    public getPosition(): THREE.Vector3 {
        return this.position.clone();
    }
    
    public getSpeed(): number {
        return this.speed;
    }
    
    public reset(): void {
        this.position.set(0, 0, 0);
        this.rotation = 0;
        this.velocity = 0;
        this.speed = 0;
        this.steeringAngle = 0;
        
        if (this.model) {
            this.model.position.copy(this.position);
            this.model.rotation.y = this.rotation + Math.PI;
        }
    }
    
    public setVolume(volume: number): void {
        this.engineVolume = Math.max(0, Math.min(1, volume));
        
        // Immediately apply volume setting if engine sound exists
        if (this.engineSound) {
            // Keep current playback rate calculation but update volume
            const calculatedVolume = Math.min(this.engineVolume * 0.8, this.engineVolume * (Math.abs(this.speed) / 50));
            this.engineSound.volume = calculatedVolume;
        }
    }
    
    public setQuality(quality: string): void {
        this.quality = quality;
        // No need to adjust model details as we're using the full quality model directly
    }
    
    public getObject(): THREE.Object3D {
        return this.model;
    }
    
    public loadModelByName(modelName: string): void {
        // Add this method to load using fetch first
        this.loadModelWithFetch(modelName);
    }
    
    private loadModelWithFetch(modelName: string): void {
        // Use ONLY files that exist in our public directory
        const modelPath = modelName === 'porsche' 
            ? 'assets/models/2020_porsche_718_cayman_gt4.glb'
            : 'assets/models/Sports.glb';
        
        console.log(`LOADING MODEL FROM ASSETS DIRECTORY: ${modelPath}`);
        
        // Remove existing model
        if (this.model && this.model.parent) {
            this.scene.remove(this.model);
        }
        
        // Show placeholder while loading
        if (!this.tempModel.parent) {
            this.scene.add(this.tempModel);
        }
        
        // Load the model directly 
        this.loader.load(
            modelPath,
            (gltf) => {
                console.log(`SUCCESS! Loaded model: ${modelPath}`);
                
                // Remove placeholder
                if (this.tempModel.parent) {
                    this.scene.remove(this.tempModel);
                }
                
                // Process loaded model
                this.model = gltf.scene;
                
                // Set model position and rotation
                this.model.position.copy(this.position);
                this.model.rotation.y = Math.PI;
                
                // Set appropriate scale
                if (modelName === 'porsche') {
                    this.model.scale.set(1.0, 1.0, 1.0);
                } else {
                    this.model.scale.set(0.8, 0.8, 0.8);
                }
                
                // ADD EVERY MESH TO CAST SHADOWS
                this.model.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                
                // Add to scene
                this.scene.add(this.model);
                
                console.log(`Model ${modelPath} added to scene!`);
            },
            (xhr) => {
                const percent = Math.round((xhr.loaded / xhr.total) * 100);
                console.log(`Loading model ${percent}% complete`);
            },
            (error) => {
                console.error(`ERROR LOADING MODEL: ${error instanceof Error ? error.message : String(error)}`);
                
                // Keep using placeholder model
                if (!this.tempModel.parent) {
                    this.scene.add(this.tempModel);
                }
                
                // No alert to avoid disrupting user experience
                console.log("Using placeholder vehicle model instead");
            }
        );
    }
} 