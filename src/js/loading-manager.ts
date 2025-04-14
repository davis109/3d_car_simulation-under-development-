import * as THREE from 'three';

export class LoadingManager {
    private manager: THREE.LoadingManager;
    private loadingCompleted: boolean = false;
    
    constructor() {
        this.manager = new THREE.LoadingManager();
        
        this.manager.onProgress = (url: string, loaded: number, total: number) => {
            console.log(`Loading file: ${url}. Loaded ${loaded} of ${total} files.`);
        };
        
        this.manager.onLoad = () => {
            console.log('Loading complete!');
            this.loadingCompleted = true;
        };
        
        this.manager.onError = (url: string) => {
            console.error('Error loading', url);
        };
        
        // Force loading completion after a short delay if no resources loaded
        setTimeout(() => {
            if (!this.loadingCompleted && this.manager.onLoad) {
                console.log('Forcing loading completion');
                this.manager.onLoad();
            }
        }, 1000);
    }
    
    // Get the THREE.LoadingManager instance
    getManager(): THREE.LoadingManager {
        return this.manager;
    }
    
    get onProgress() {
        return this.manager.onProgress;
    }
    
    set onProgress(callback: (url: string, loaded: number, total: number) => void) {
        this.manager.onProgress = callback;
    }
    
    get onLoad() {
        return this.manager.onLoad;
    }
    
    set onLoad(callback: () => void) {
        this.manager.onLoad = callback;
    }
    
    get onError() {
        return this.manager.onError;
    }
    
    set onError(callback: (url: string) => void) {
        this.manager.onError = callback;
    }
} 