/* ============================================
   Router - Screen Navigation with Transitions
   ============================================ */

export class Router {
    constructor(gameState) {
        this.state = gameState;
        this.screens = {};
        this.currentScreen = null;
        this.transitioning = false;
    }

    register(name, element) {
        this.screens[name] = element;
        element.classList.remove('active');
    }

    async navigate(screenName, options = {}) {
        if (this.transitioning) return;
        if (this.currentScreen === screenName && !options.force) return;

        const target = this.screens[screenName];
        if (!target) {
            console.error(`Screen "${screenName}" not registered`);
            return;
        }

        this.transitioning = true;
        const previous = this.currentScreen ? this.screens[this.currentScreen] : null;

        // Exit current screen
        if (previous) {
            previous.style.animation = 'roomExit 0.3s ease forwards';
            await this._wait(300);
            previous.classList.remove('active');
            previous.style.animation = '';
        }

        // Enter new screen
        target.classList.add('active');
        target.style.animation = 'roomEnter 0.4s ease forwards';
        await this._wait(400);
        target.style.animation = '';

        const previousScreen = this.currentScreen;
        this.currentScreen = screenName;
        this.transitioning = false;

        this.state.set('currentScreen', screenName);
        this.state.emit('screenChanged', { from: previousScreen, to: screenName });
    }

    getCurrentScreen() {
        return this.currentScreen;
    }

    _wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
