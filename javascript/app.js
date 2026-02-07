/* ============================================
   App - Top-level Orchestrator
   ============================================ */

import { GameState } from './state.js';
import { Router } from './router.js';
import { Timer } from './timer.js';
import { AudioManager } from './audio.js';
import { ProgressTracker } from './progress-tracker.js';
import { PuzzleEngine } from './puzzle-engine.js';
import { AIService } from './ai-service.js';

export class App {
    constructor() {
        // Core services
        this.state = new GameState();
        this.router = new Router(this.state);
        this.timer = new Timer(this.state);
        this.audio = new AudioManager(this.state);
        this.progress = new ProgressTracker(this.state, this.audio);
        this.puzzleEngine = new PuzzleEngine(this.state);
        this.ai = new AIService(this.state);

        // Current active room instance
        this.currentRoom = null;

        // Room class registry (lazy loaded)
        this.roomModules = {
            space: () => import('./rooms/room-space.js'),
            food: () => import('./rooms/room-food.js'),
            ethics: () => import('./rooms/room-ethics.js'),
            green: () => import('./rooms/room-green.js'),
            cyber: () => import('./rooms/room-cyber.js'),
        };

        // Debug mode
        this.debug = new URLSearchParams(window.location.search).has('debug');
    }

    async init() {
        // Register screens
        this._registerScreens();

        // Bind HUD elements
        this._bindHUD();

        // Load puzzle data
        await this.puzzleEngine.loadPuzzles();
        await this.progress.loadBadges();

        // Set up event listeners
        this._setupEvents();

        // Set up UI event handlers
        this._setupUIHandlers();

        // Check for existing save
        if (this.state.hasSave()) {
            this._showContinueOption();
        }

        // Navigate to title screen
        await this.router.navigate('title');

        // Initialize audio on first user interaction
        document.addEventListener('click', () => this.audio.init(), { once: true });

        if (this.debug) {
            this._initDebugMode();
        }

        console.log('The AI Vault initialized');
    }

    _registerScreens() {
        const screenIds = ['title', 'settings', 'room-select', 'room', 'meta', 'end'];
        for (const id of screenIds) {
            const el = document.getElementById(`screen-${id}`);
            if (el) {
                this.router.register(id, el);
            }
        }
    }

    _bindHUD() {
        this.hud = document.getElementById('hud');
        this.timer.bind(document.getElementById('hud-timer'));
        this.progress.bindProgressBar(document.getElementById('hud-progress-bar'));

        // Show/hide HUD based on screen
        this.state.on('change:currentScreen', ({ value }) => {
            const showHud = ['room-select', 'room', 'meta'].includes(value);
            this.hud.classList.toggle('visible', showHud);
        });
    }

    _setupEvents() {
        // Room completed handler
        this.state.on('roomCompleted', ({ roomId }) => {
            this._showToast(`Room completed! Artifact collected.`, 'success');
            this.timer.stopRoomTimer(roomId);
            this._updateRoomSelectCards();
        });

        // Badge earned handler
        this.state.on('badgeEarned', ({ badgeId }) => {
            this._showToast(`Badge earned: ${badgeId}`, 'success');
        });

        // Hint used handler
        this.state.on('hintUsed', ({ remaining }) => {
            this._updateHintDisplay();
            if (remaining <= 2) {
                this._showToast(`${remaining} hints remaining`, 'info');
            }
        });
    }

    _setupUIHandlers() {
        // Title screen buttons
        this._on('#btn-new-game', 'click', () => this._startNewGame());
        this._on('#btn-continue', 'click', () => this._continueGame());
        this._on('#btn-settings', 'click', () => this.router.navigate('settings'));

        // Settings screen
        this._on('#btn-settings-back', 'click', () => this.router.navigate('title'));
        this._on('#btn-settings-save', 'click', () => this._saveSettings());
        this._on('#btn-start-game', 'click', () => this._enterRoomSelect());

        // Room select
        this._on('#btn-room-back', 'click', () => this.router.navigate('title'));

        // Room navigation
        this._on('#btn-room-hub', 'click', () => this._returnToHub());
        this._on('#btn-hint', 'click', () => this._requestHint());

        // Meta puzzle
        this._on('#btn-meta-back', 'click', () => this.router.navigate('room-select'));

        // End screen
        this._on('#btn-play-again', 'click', () => this._playAgain());

        // Room cards (delegated)
        const roomGrid = document.getElementById('room-grid');
        if (roomGrid) {
            roomGrid.addEventListener('click', (e) => {
                const card = e.target.closest('.room-card');
                if (card && !card.classList.contains('locked')) {
                    const roomId = card.dataset.room;
                    this._enterRoom(roomId);
                }
            });
        }

        // Sound toggle
        this._on('#btn-sound-toggle', 'click', () => {
            const enabled = !this.state.get('settings.soundEnabled');
            this.state.set('settings.soundEnabled', enabled);
            this._updateSoundButton();
        });
    }

    /* ---- Game Flow ---- */

    _startNewGame() {
        this.audio.play('click');
        this.state.clearSave();
        this.router.navigate('settings');
    }

    _continueGame() {
        this.audio.play('click');
        this.state.load();
        this._enterRoomSelect();
    }

    _saveSettings() {
        this.audio.play('click');
        const providerEl = document.getElementById('ai-provider');
        const keyEl = document.getElementById('api-key');

        if (providerEl && keyEl && keyEl.value.trim()) {
            this.ai.configure(keyEl.value.trim(), providerEl.value);
        }

        const soundEl = document.getElementById('sound-toggle');
        if (soundEl) {
            this.state.set('settings.soundEnabled', soundEl.checked);
        }
    }

    _enterRoomSelect() {
        this.audio.play('transition');
        this.timer.start();
        this._updateRoomSelectCards();
        this._updateHintDisplay();
        this.router.navigate('room-select');
    }

    async _enterRoom(roomId) {
        this.audio.play('click');
        this.state.set('currentRoom', roomId);
        this.state.set('currentPuzzleIndex', 0);

        // Apply room theme
        const container = document.getElementById('game-container');
        container.className = `room-${roomId}`;

        // Update HUD
        const roomNames = {
            space: 'Space Operations AI Hub',
            food: 'Smart Food Systems Lab',
            ethics: 'Ethics & Governance Archive',
            green: 'Green Tech & Sustainability Core',
            cyber: 'Cyber City Code Breakout'
        };
        const roomNameEl = document.getElementById('hud-room-name');
        if (roomNameEl) roomNameEl.textContent = roomNames[roomId] || roomId;

        // Start room timer
        this.timer.startRoomTimer(roomId);

        // Load room module
        try {
            const module = await this.roomModules[roomId]();
            const RoomClass = module.default;
            this.currentRoom = new RoomClass(
                this.state,
                this.puzzleEngine,
                this.ai,
                this.audio,
                this.progress
            );

            await this.router.navigate('room');
            await this.currentRoom.enter(document.getElementById('room-content'));
        } catch (err) {
            console.error(`Failed to load room ${roomId}:`, err);
            this._showToast('Failed to load room', 'error');
        }
    }

    async _returnToHub() {
        this.audio.play('transition');
        if (this.currentRoom) {
            await this.currentRoom.exit();
            this.currentRoom = null;
        }

        // Clear room theme
        document.getElementById('game-container').className = '';
        this.state.set('currentRoom', null);

        this._updateRoomSelectCards();
        this.router.navigate('room-select');
    }

    async enterMetaPuzzle() {
        this.audio.play('unlock');
        try {
            const { default: MetaPuzzle } = await import('./meta-puzzle.js');
            this.metaPuzzle = new MetaPuzzle(this.state, this.audio, this.progress);
            await this.router.navigate('meta');
            await this.metaPuzzle.enter(document.getElementById('meta-content'));
        } catch (err) {
            console.error('Failed to load meta puzzle:', err);
        }
    }

    showEndScreen() {
        this.timer.stop();
        this.progress.checkEndGameBadges();
        this._renderEndScreen();
        this.audio.play('vault');
        this.router.navigate('end');
    }

    _playAgain() {
        this.audio.play('click');
        this.state.clearSave();
        document.getElementById('game-container').className = '';
        this.timer.reset();
        this.router.navigate('title');
    }

    /* ---- Hints ---- */

    async _requestHint() {
        if (!this.state.useHint()) {
            this._showToast('No hints remaining!', 'error');
            return;
        }

        this.audio.play('hint');

        if (this.currentRoom && this.currentRoom.getCurrentPuzzle) {
            const puzzle = this.currentRoom.getCurrentPuzzle();
            if (puzzle) {
                const context = puzzle.getHintContext();
                const roomId = this.state.get('currentRoom');
                const puzzleConfig = this.puzzleEngine.getPuzzleConfig(roomId, puzzle.config.id);
                const character = puzzleConfig?.character || 'mentor';
                const hintLevel = Math.min(puzzle.attempts + 1, 3);

                const hint = await this.ai.getHint(
                    { ...context, hints: puzzleConfig?.hints },
                    hintLevel,
                    character
                );

                this._showHintModal(hint, character);
            }
        }
    }

    /* ---- UI Updates ---- */

    _updateRoomSelectCards() {
        const cards = document.querySelectorAll('.room-card');
        cards.forEach(card => {
            const roomId = card.dataset.room;
            const unlocked = this.state.get(`rooms.${roomId}.unlocked`);
            const completed = this.state.get(`rooms.${roomId}.completed`);

            card.classList.toggle('locked', !unlocked);
            card.classList.toggle('completed', completed);

            const statusEl = card.querySelector('.room-status');
            if (statusEl) {
                if (completed) {
                    statusEl.textContent = 'COMPLETED';
                    statusEl.className = 'room-status badge badge-success';
                } else if (unlocked) {
                    statusEl.textContent = 'UNLOCKED';
                    statusEl.className = 'room-status badge badge-accent';
                } else {
                    statusEl.textContent = 'LOCKED';
                    statusEl.className = 'room-status badge';
                }
            }
        });

        // Meta puzzle button
        const metaBtn = document.getElementById('btn-meta-puzzle');
        if (metaBtn) {
            metaBtn.classList.toggle('locked', !this.state.get('metaPuzzleUnlocked'));
            metaBtn.disabled = !this.state.get('metaPuzzleUnlocked');
            if (this.state.get('metaPuzzleUnlocked')) {
                metaBtn.addEventListener('click', () => this.enterMetaPuzzle(), { once: true });
            }
        }
    }

    _updateHintDisplay() {
        const el = document.getElementById('hud-hints');
        if (el) {
            el.textContent = `${this.state.getHintsRemaining()}`;
        }
    }

    _updateSoundButton() {
        const btn = document.getElementById('btn-sound-toggle');
        if (btn) {
            const enabled = this.state.get('settings.soundEnabled');
            btn.textContent = enabled ? '🔊' : '🔇';
        }
    }

    _showContinueOption() {
        const btn = document.getElementById('btn-continue');
        if (btn) {
            btn.style.display = 'inline-flex';
        }
    }

    _showHintModal(hint, character) {
        const overlay = document.getElementById('hint-modal');
        if (!overlay) return;

        const charNames = { mentor: 'ARIA', admin: 'SYS-OP', rogue: 'ECHO' };
        const charEmojis = { mentor: '🤖', admin: '⚙️', rogue: '👁️' };

        const nameEl = overlay.querySelector('.character-name');
        const msgEl = overlay.querySelector('.character-message');
        const avatarEl = overlay.querySelector('.character-avatar');

        if (nameEl) nameEl.textContent = charNames[character] || 'ARIA';
        if (msgEl) msgEl.textContent = hint.text;
        if (avatarEl) avatarEl.textContent = charEmojis[character] || '🤖';

        overlay.classList.add('active');

        const closeBtn = overlay.querySelector('.modal-close');
        const closeFn = () => {
            overlay.classList.remove('active');
            closeBtn.removeEventListener('click', closeFn);
        };
        if (closeBtn) closeBtn.addEventListener('click', closeFn);

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeFn();
        }, { once: true });
    }

    _showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        container.appendChild(toast);

        requestAnimationFrame(() => toast.classList.add('show'));

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    _renderEndScreen() {
        const elapsed = this.timer.getElapsed();
        const progress = this.state.getOverallProgress();
        const badges = this.progress.getEarnedBadges();

        const container = document.getElementById('end-content');
        if (!container) return;

        container.innerHTML = `
            <div class="end-stats">
                <h2>Mission Complete</h2>
                <div class="end-stat-grid">
                    <div class="end-stat">
                        <div class="end-stat-value">${Timer.format(elapsed)}</div>
                        <div class="end-stat-label">Total Time</div>
                    </div>
                    <div class="end-stat">
                        <div class="end-stat-value">${progress.puzzlesSolved}/15</div>
                        <div class="end-stat-label">Puzzles Solved</div>
                    </div>
                    <div class="end-stat">
                        <div class="end-stat-value">${this.state.get('score.points')}</div>
                        <div class="end-stat-label">Points</div>
                    </div>
                    <div class="end-stat">
                        <div class="end-stat-value">${badges.length}</div>
                        <div class="end-stat-label">Badges Earned</div>
                    </div>
                </div>
                ${this._renderRoomTimes()}
                ${this._renderBadges(badges)}
            </div>
        `;
    }

    _renderRoomTimes() {
        const rooms = [
            { id: 'space', name: 'Space Operations' },
            { id: 'food', name: 'Food Systems' },
            { id: 'ethics', name: 'Ethics Archive' },
            { id: 'green', name: 'Green Tech' },
            { id: 'cyber', name: 'Cyber City' }
        ];

        const rows = rooms.map(r => {
            const time = this.timer.getRoomTime(r.id);
            return `<div class="room-time-row">
                <span>${r.name}</span>
                <span class="font-mono">${Timer.format(time)}</span>
            </div>`;
        }).join('');

        return `<div class="room-times"><h4>Room Times</h4>${rows}</div>`;
    }

    _renderBadges(badges) {
        if (badges.length === 0) return '';
        const badgeHtml = badges.map(b =>
            `<div class="badge-item">
                <div class="badge-icon">${b.icon || '🏆'}</div>
                <div class="badge-name">${b.name}</div>
                <div class="badge-desc">${b.criteria}</div>
            </div>`
        ).join('');

        return `<div class="badges-display"><h4>Badges Earned</h4><div class="badge-grid">${badgeHtml}</div></div>`;
    }

    /* ---- Helpers ---- */

    _on(selector, event, handler) {
        const el = document.querySelector(selector);
        if (el) el.addEventListener(event, handler);
    }

    /* ---- Debug Mode ---- */

    _initDebugMode() {
        console.log('%c[DEBUG MODE]', 'color: #f59e0b; font-weight: bold;');
        window._game = this;
        window._state = this.state;

        // Add debug panel
        const panel = document.createElement('div');
        panel.id = 'debug-panel';
        panel.style.cssText = 'position:fixed;bottom:0;left:0;background:rgba(0,0,0,0.9);color:#0f0;font-family:monospace;font-size:11px;padding:8px;z-index:9999;max-width:300px;max-height:200px;overflow:auto;';
        panel.innerHTML = `
            <div><strong>[DEBUG]</strong></div>
            <button onclick="_game._enterRoom('space')">Room 1</button>
            <button onclick="_game._enterRoom('food')">Room 2</button>
            <button onclick="_game._enterRoom('ethics')">Room 3</button>
            <button onclick="_game._enterRoom('green')">Room 4</button>
            <button onclick="_game._enterRoom('cyber')">Room 5</button>
            <button onclick="_game.enterMetaPuzzle()">Meta</button>
            <button onclick="_game.showEndScreen()">End</button>
            <button onclick="_state.clearSave(); location.reload();">Reset</button>
        `;
        document.body.appendChild(panel);

        // Unlock all rooms in debug
        ['space', 'food', 'ethics', 'green', 'cyber'].forEach(r => {
            this.state.set(`rooms.${r}.unlocked`, true);
        });
    }
}
