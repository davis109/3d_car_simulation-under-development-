import * as THREE from 'three';
import { Game } from './game';
import { LoadingManager } from './loading-manager';
import { UIController } from './ui-controller';

console.log('Main script loaded');

// Initialize the loading manager
const loadingManager = new LoadingManager();

// Show loading screen
const loadingScreen = document.getElementById('loading-screen') as HTMLElement;
const progressBar = document.getElementById('progress-bar') as HTMLElement;
const loadingText = document.getElementById('loading-text') as HTMLElement;
const startButton = document.getElementById('start-button') as HTMLButtonElement;

console.log('DOM elements:', { 
  loadingScreen: !!loadingScreen, 
  progressBar: !!progressBar, 
  loadingText: !!loadingText, 
  startButton: !!startButton 
});

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM content loaded');
    
    // Set up loading manager event handlers
    loadingManager.onProgress = (url, loaded, total) => {
        console.log(`Loading progress: ${url}, ${loaded}/${total}`);
        const progress = (loaded / total) * 100;
        progressBar.style.width = `${progress}%`;
        loadingText.textContent = `Loading: ${Math.round(progress)}%`;
    };

    loadingManager.onLoad = () => {
        console.log('Loading complete');
        loadingText.textContent = 'Loading complete!';
        startButton.classList.remove('hidden');
        // Force update visibility in case the class removal doesn't trigger a repaint
        startButton.style.display = 'inline-block';
    };

    loadingManager.onError = (url) => {
        console.error(`Error loading: ${url}`);
        loadingText.textContent = 'Error loading resources. Please refresh.';
    };

    try {
        console.log('Creating game instance');
        // Create game instance
        const game = new Game(loadingManager);
        
        console.log('Initializing UI controller');
        // Initialize UI controller
        const uiController = new UIController(game);

        // Start button event listener
        startButton.addEventListener('click', () => {
            console.log('Start button clicked');
            
            // Get selected car and music
            const carSelection = document.getElementById('car-selection') as HTMLSelectElement;
            const musicSelection = document.getElementById('music-selection') as HTMLSelectElement;
            
            const selectedCar = carSelection ? carSelection.value : 'porsche';
            const selectedMusic = musicSelection ? musicSelection.value : 'wind';
            
            console.log(`EXPLICITLY SELECTED CAR: ${selectedCar}, AUDIO: ${selectedMusic}`);
            
            // Pass selections to the game
            game.setCarModel(selectedCar);
            game.setBackgroundMusic(selectedMusic);
            
            // Initialize audio after user interaction
            if (game.getVehicle()) {
                game.getVehicle().initAudio();
            }
            
            loadingScreen.classList.add('hidden');
            
            // Start the game with the selected options
            console.log('Starting game with the selected options');
            game.start();
            
            // Debug to check the car selection is working
            setTimeout(() => {
                if (game.getVehicle()) {
                    console.log(`Car position: ${game.getVehicle().getPosition().x.toFixed(2)}, ${game.getVehicle().getPosition().y.toFixed(2)}, ${game.getVehicle().getPosition().z.toFixed(2)}`);
                }
            }, 2000);
        });

        console.log('Initializing game');
        // Initialize the game
        game.init();
        
        // Setup touch controls
        setupTouchControls(game);
        
        // Setup speedometer updates
        setupSpeedometerUpdates(game);
        
        console.log('Game initialization complete');
    } catch (error) {
        console.error('Error initializing game:', error);
    }
});

// Helper function to set up touch controls
function setupTouchControls(game: any): void {
    // Get all touch control buttons
    const controlUp = document.getElementById('control-up');
    const controlDown = document.getElementById('control-down');
    const controlLeft = document.getElementById('control-left');
    const controlRight = document.getElementById('control-right');
    const resetButton = document.getElementById('reset-button');
    
    if (!controlUp || !controlDown || !controlLeft || !controlRight || !resetButton) {
        console.warn('Touch controls not found in the DOM');
        return;
    }
    
    // Function to handle touch start
    const onTouchStart = (key: string) => {
        return (e: Event) => {
            e.preventDefault();
            if (game && game.getInputKeys) {
                game.getInputKeys()[key] = true;
                console.log(`Touch control activated: ${key}`);
            }
        };
    };
    
    // Function to handle touch end
    const onTouchEnd = (key: string) => {
        return (e: Event) => {
            e.preventDefault();
            if (game && game.getInputKeys) {
                game.getInputKeys()[key] = false;
                console.log(`Touch control released: ${key}`);
            }
        };
    };
    
    // Attach event listeners for touch and mouse
    const addControlEvents = (element: HTMLElement, key: string) => {
        // For touch devices
        element.addEventListener('touchstart', onTouchStart(key));
        element.addEventListener('touchend', onTouchEnd(key));
        element.addEventListener('touchcancel', onTouchEnd(key));
        
        // For mouse (so it works in desktop browsers too)
        element.addEventListener('mousedown', onTouchStart(key));
        element.addEventListener('mouseup', onTouchEnd(key));
        element.addEventListener('mouseleave', onTouchEnd(key));
        
        // Make buttons visible on all devices for testing
        element.style.pointerEvents = 'auto';
        
        // Change color on press for visual feedback
        element.addEventListener('mousedown', () => {
            element.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
        });
        element.addEventListener('mouseup', () => {
            element.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
        });
        element.addEventListener('touchstart', () => {
            element.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
        });
        element.addEventListener('touchend', () => {
            element.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
        });
    };
    
    // Make touch controls visible on all devices for testing
    const touchControls = document.getElementById('touch-controls');
    if (touchControls) {
        touchControls.style.display = 'block';
    }
    
    // Add events for all controls
    addControlEvents(controlUp, 'up');
    addControlEvents(controlDown, 'down');
    addControlEvents(controlLeft, 'left');
    addControlEvents(controlRight, 'right');
    
    // Add reset button
    resetButton.addEventListener('click', () => {
        if (game && game.getVehicle()) {
            game.getVehicle().reset();
            console.log('Vehicle reset via touch control');
        }
    });
    
    // Also add keyboard focus to game container for keyboard controls
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
        gameContainer.setAttribute('tabindex', '0');
        gameContainer.focus();
        console.log('Game container focused for keyboard input');
    }
}

// Helper function to set up speedometer updates
function setupSpeedometerUpdates(game: any): void {
    const speedValue = document.getElementById('speed-value');
    const keyIndicator = document.getElementById('key-indicator');
    
    if (!speedValue || !keyIndicator) {
        console.warn('Speedometer or key indicator not found in the DOM');
        return;
    }
    
    // Update speedometer and key indicator every frame
    setInterval(() => {
        if (game && game.getVehicle()) {
            const speed = game.getVehicle().getSpeed();
            speedValue.textContent = Math.abs(speed).toFixed(0);
            
            // Update key indicator
            if (game.getInputKeys) {
                const keys = Object.keys(game.getInputKeys()).filter(k => game.getInputKeys()[k]);
                keyIndicator.textContent = keys.length > 0 ? 
                    `Keys: ${keys.join(', ')}` : 
                    'No keys pressed';
            }
        }
    }, 100); // Update 10 times per second
    
    // FORCE TEST - Simulate key presses to test car movement
    console.log("Setting up auto-drive test...");
    setTimeout(() => {
        if (game && game.getInputKeys) {
            console.log("AUTO-DRIVE TEST: Applying forward acceleration");
            // Simulate pressing the W key for 3 seconds
            game.getInputKeys()['w'] = true;
            
            setTimeout(() => {
                if (game && game.getInputKeys) {
                    console.log("AUTO-DRIVE TEST: Releasing acceleration");
                    game.getInputKeys()['w'] = false;
                }
            }, 3000);
        }
    }, 2000);
} 