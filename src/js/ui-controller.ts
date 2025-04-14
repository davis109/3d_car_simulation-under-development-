import { Game } from './game';

export class UIController {
    private game: Game;
    private speedElement: HTMLElement;
    private menuElement: HTMLElement;
    private resumeButton: HTMLButtonElement;
    private qualitySelect: HTMLSelectElement;
    private volumeSlider: HTMLInputElement;
    
    constructor(game: Game) {
        this.game = game;
        
        // Get UI elements
        this.speedElement = document.getElementById('speed-value') as HTMLElement;
        this.menuElement = document.getElementById('menu') as HTMLElement;
        this.resumeButton = document.getElementById('resume-button') as HTMLButtonElement;
        this.qualitySelect = document.getElementById('quality-setting') as HTMLSelectElement;
        this.volumeSlider = document.getElementById('volume-setting') as HTMLInputElement;
        
        // Set up event listeners
        window.addEventListener('keydown', this.handleKeydown.bind(this));
        this.resumeButton.addEventListener('click', this.hideMenu.bind(this));
        this.qualitySelect.addEventListener('change', this.updateQuality.bind(this));
        this.volumeSlider.addEventListener('input', this.updateVolume.bind(this));
    }
    
    public updateSpeedometer(speed: number): void {
        this.speedElement.textContent = Math.round(speed).toString();
    }
    
    private handleKeydown(event: KeyboardEvent): void {
        // ESC to toggle menu
        if (event.key === 'Escape') {
            if (this.menuElement.classList.contains('hidden')) {
                this.showMenu();
            } else {
                this.hideMenu();
            }
        }
    }
    
    private showMenu(): void {
        this.menuElement.classList.remove('hidden');
        this.game.pause();
    }
    
    private hideMenu(): void {
        this.menuElement.classList.add('hidden');
        this.game.resume();
    }
    
    private updateQuality(event: Event): void {
        const quality = (event.target as HTMLSelectElement).value;
        this.game.setQuality(quality);
    }
    
    private updateVolume(event: Event): void {
        const volume = Number((event.target as HTMLInputElement).value) / 100;
        this.game.setVolume(volume);
    }
} 