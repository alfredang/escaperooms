/* ============================================
   BaseRoom - Shared Room Lifecycle
   ============================================ */

export default class BaseRoom {
    constructor(gameState, puzzleEngine, aiService, audioManager, progressTracker) {
        this.state = gameState;
        this.puzzleEngine = puzzleEngine;
        this.ai = aiService;
        this.audio = audioManager;
        this.progress = progressTracker;

        this.roomId = '';
        this.container = null;
        this.puzzles = [];
        this.currentPuzzleIndex = 0;
        this.currentPuzzle = null;
    }

    async enter(containerElement) {
        this.container = containerElement;
        this.container.innerHTML = '';

        // Load puzzle configs
        const puzzleConfigs = this.puzzleEngine.getPuzzlesForRoom(this.roomId);
        if (!puzzleConfigs.length) {
            this.container.innerHTML = '<p class="text-muted">No puzzles configured for this room.</p>';
            return;
        }

        // Determine which puzzle to start at (resume support)
        const roomState = this.state.get(`rooms.${this.roomId}.puzzles`) || {};
        this.currentPuzzleIndex = 0;
        for (let i = 0; i < puzzleConfigs.length; i++) {
            if (roomState[puzzleConfigs[i].id]?.solved) {
                this.currentPuzzleIndex = i + 1;
            } else {
                break;
            }
        }

        // Check if room already completed
        if (this.currentPuzzleIndex >= puzzleConfigs.length) {
            this._showRoomComplete();
            return;
        }

        // Render room shell
        this._renderRoomShell(puzzleConfigs);

        // Show intro narration
        const roomConfig = this.puzzleEngine.getRoomConfig(this.roomId);
        if (roomConfig?.introNarration) {
            await this._showNarration(roomConfig.introNarration, roomConfig.character || 'mentor');
        }

        // Load first unsolved puzzle
        await this._loadPuzzle(puzzleConfigs[this.currentPuzzleIndex]);
    }

    async exit() {
        if (this.currentPuzzle) {
            this.currentPuzzle.destroy();
            this.currentPuzzle = null;
        }
        if (this.container) {
            this.container.innerHTML = '';
        }
    }

    getCurrentPuzzle() {
        return this.currentPuzzle;
    }

    /* ---- Room Shell ---- */

    _renderRoomShell(puzzleConfigs) {
        // Progress dots
        const dots = puzzleConfigs.map((_, i) => {
            let cls = 'progress-dot';
            if (i < this.currentPuzzleIndex) cls += ' completed';
            else if (i === this.currentPuzzleIndex) cls += ' active';
            return `<div class="${cls}"></div>`;
        }).join('');

        this.container.innerHTML = `
            <div class="room-shell">
                <div class="room-progress-dots">
                    <div class="progress-dots">${dots}</div>
                    <span class="text-muted" style="font-size: var(--font-size-xs);">
                        Puzzle ${this.currentPuzzleIndex + 1} of ${puzzleConfigs.length}
                    </span>
                </div>
                <div id="room-narration"></div>
                <div id="room-puzzle-area"></div>
            </div>
        `;

        // Bind dots for progress tracker
        const dotsEl = this.container.querySelector('.progress-dots');
        if (dotsEl) {
            this.progress.bindProgressDots(dotsEl, puzzleConfigs.length);
        }
    }

    /* ---- Puzzle Loading ---- */

    async _loadPuzzle(puzzleConfig) {
        const puzzleArea = this.container.querySelector('#room-puzzle-area');
        if (!puzzleArea) return;
        puzzleArea.innerHTML = '';

        this.state.set('currentPuzzleIndex', this.currentPuzzleIndex);

        try {
            const puzzle = await this.puzzleEngine.createPuzzle(
                puzzleConfig,
                this.state,
                this.audio
            );

            if (!puzzle) {
                puzzleArea.innerHTML = '<p class="text-muted">Failed to load puzzle.</p>';
                return;
            }

            this.currentPuzzle = puzzle;

            puzzle.onSolvedCallback = (result) => this._onPuzzleSolved(puzzleConfig, result);
            puzzle.render(puzzleArea);
        } catch (err) {
            console.error('Error loading puzzle:', err);
            puzzleArea.innerHTML = '<p class="text-muted">Error loading puzzle.</p>';
        }
    }

    async _onPuzzleSolved(puzzleConfig, result) {
        // Record in state
        this.state.markPuzzleSolved(this.roomId, puzzleConfig.id, result);

        // Update dots
        const dots = this.container.querySelectorAll('.progress-dot');
        if (dots[this.currentPuzzleIndex]) {
            dots[this.currentPuzzleIndex].classList.remove('active');
            dots[this.currentPuzzleIndex].classList.add('completed');
        }

        // Check if more puzzles
        const puzzleConfigs = this.puzzleEngine.getPuzzlesForRoom(this.roomId);
        this.currentPuzzleIndex++;

        if (this.currentPuzzleIndex >= puzzleConfigs.length) {
            // Room complete!
            await this._wait(1500);
            this._completeRoom();
        } else {
            // Next puzzle
            await this._wait(1500);

            // Update progress indicator
            if (dots[this.currentPuzzleIndex]) {
                dots[this.currentPuzzleIndex].classList.add('active');
            }
            const counterEl = this.container.querySelector('.room-progress-dots span');
            if (counterEl) {
                counterEl.textContent = `Puzzle ${this.currentPuzzleIndex + 1} of ${puzzleConfigs.length}`;
            }

            // Destroy old, load new
            if (this.currentPuzzle) {
                this.currentPuzzle.destroy();
                this.currentPuzzle = null;
            }
            await this._loadPuzzle(puzzleConfigs[this.currentPuzzleIndex]);
        }
    }

    _completeRoom() {
        const roomConfig = this.puzzleEngine.getRoomConfig(this.roomId);
        const artifact = roomConfig?.artifact || { name: 'Unknown Artifact', metaClue: '' };

        this.audio.play('unlock');
        this.state.markRoomCompleted(this.roomId, artifact);

        this._showRoomComplete(artifact);
    }

    _showRoomComplete(artifact) {
        if (!artifact) {
            const roomConfig = this.puzzleEngine.getRoomConfig(this.roomId);
            artifact = roomConfig?.artifact || {};
        }

        this.container.innerHTML = `
            <div class="room-complete text-center animate-slide-up">
                <div class="room-complete-icon animate-pulse-glow" style="font-size: 4rem; margin-bottom: var(--spacing-xl);">
                    🔑
                </div>
                <h2>Room Complete!</h2>
                <p class="text-muted" style="margin: var(--spacing-md) 0;">
                    You've collected an artifact.
                </p>
                <div class="panel panel-glow" style="display: inline-block; margin: var(--spacing-xl) auto;">
                    <h4 style="color: var(--room-accent);">${artifact.name || 'Artifact'}</h4>
                    <p class="text-muted font-mono" style="margin-top: var(--spacing-sm);">
                        "${artifact.metaClue || ''}"
                    </p>
                </div>
                <p class="text-muted" style="margin-top: var(--spacing-xl); font-size: var(--font-size-sm);">
                    Remember this clue — you'll need it for the final vault.
                </p>
            </div>
        `;
    }

    /* ---- Narration ---- */

    async _showNarration(text, character) {
        const el = this.container.querySelector('#room-narration');
        if (!el) return;

        const charNames = { mentor: 'ARIA', admin: 'SYS-OP', rogue: 'ECHO' };
        const charEmojis = { mentor: '🤖', admin: '⚙️', rogue: '👁️' };

        el.innerHTML = `
            <div class="character-bubble animate-slide-up" style="margin-bottom: var(--spacing-xl);">
                <div class="character-avatar">${charEmojis[character] || '🤖'}</div>
                <div class="character-text">
                    <div class="character-name">${charNames[character] || character}</div>
                    <div class="character-message">${text}</div>
                </div>
            </div>
        `;

        await this._wait(500);
    }

    /* ---- Utility ---- */

    _wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
