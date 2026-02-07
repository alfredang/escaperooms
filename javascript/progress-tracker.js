/* ============================================
   ProgressTracker - Room/Puzzle Completion & Badges
   ============================================ */

export class ProgressTracker {
    constructor(gameState, audioManager) {
        this.state = gameState;
        this.audio = audioManager;
        this.badgeDefs = [];
        this.progressElement = null;
        this.dotsElement = null;

        this.state.on('puzzleSolved', (data) => this._onPuzzleSolved(data));
        this.state.on('roomCompleted', (data) => this._onRoomCompleted(data));
    }

    async loadBadges() {
        try {
            const response = await fetch('./data/badges.json');
            this.badgeDefs = await response.json();
        } catch (err) {
            console.warn('Failed to load badges:', err);
            this.badgeDefs = [];
        }
    }

    bindProgressBar(element) {
        this.progressElement = element;
        this._renderProgressBar();
    }

    bindProgressDots(element, puzzleCount) {
        this.dotsElement = element;
        this.puzzleCount = puzzleCount;
        this._renderDots();
    }

    _onPuzzleSolved({ roomId, puzzleId, result }) {
        this._checkBadges(roomId, puzzleId, result);
        this._renderProgressBar();
        this._renderDots();
    }

    _onRoomCompleted({ roomId }) {
        this._checkRoomBadges(roomId);
        this._renderProgressBar();
    }

    _checkBadges(roomId, puzzleId, result) {
        const state = this.state;

        // Speed demon: complete any room in under 5 minutes (300 seconds)
        // Checked in _checkRoomBadges

        // Perfect logic: solve all Room 1 puzzles on first attempt
        if (roomId === 'space') {
            const puzzles = state.get('rooms.space.puzzles') || {};
            const allFirstAttempt = Object.values(puzzles).every(p => p.firstAttempt);
            if (allFirstAttempt && Object.keys(puzzles).length >= 3) {
                state.addBadge('perfect-logic');
                this.audio.play('badge');
            }
        }
    }

    _checkRoomBadges(roomId) {
        const state = this.state;

        // Speed demon
        const roomTimes = state.get('timer.roomTimes') || {};
        const rt = roomTimes[roomId];
        if (rt && rt.end && (rt.end - rt.start) < 300) {
            state.addBadge('speed-demon');
            this.audio.play('badge');
        }

        // Data master: 100% accuracy in Room 2
        if (roomId === 'food') {
            const puzzles = state.get('rooms.food.puzzles') || {};
            const allFirstAttempt = Object.values(puzzles).every(p => p.firstAttempt);
            if (allFirstAttempt) {
                state.addBadge('data-master');
                this.audio.play('badge');
            }
        }

        // Code breaker: Room 5 no failed attempts
        if (roomId === 'cyber') {
            const puzzles = state.get('rooms.cyber.puzzles') || {};
            const allFirstAttempt = Object.values(puzzles).every(p => p.firstAttempt);
            if (allFirstAttempt) {
                state.addBadge('code-breaker');
                this.audio.play('badge');
            }
        }
    }

    checkEndGameBadges() {
        const state = this.state;

        // Independent thinker: no hints used
        if (state.get('hints.used') === 0) {
            state.addBadge('no-hints');
            this.audio.play('badge');
        }

        // Vault master: completed meta puzzle
        state.addBadge('vault-master');
        this.audio.play('badge');
    }

    getEarnedBadges() {
        const earned = this.state.get('badges') || [];
        return this.badgeDefs.filter(b => earned.includes(b.id));
    }

    getAllBadges() {
        const earned = this.state.get('badges') || [];
        return this.badgeDefs.map(b => ({
            ...b,
            earned: earned.includes(b.id)
        }));
    }

    _renderProgressBar() {
        if (!this.progressElement) return;
        const progress = this.state.getOverallProgress();
        // 15 puzzles total across 5 rooms (3 each)
        const percent = Math.round((progress.puzzlesSolved / 15) * 100);
        const fill = this.progressElement.querySelector('.progress-bar-fill');
        if (fill) {
            fill.style.width = `${percent}%`;
        }
    }

    _renderDots() {
        if (!this.dotsElement) return;
        const roomId = this.state.get('currentRoom');
        if (!roomId) return;

        const puzzles = this.state.get(`rooms.${roomId}.puzzles`) || {};
        const currentIndex = this.state.get('currentPuzzleIndex') || 0;
        const dots = this.dotsElement.querySelectorAll('.progress-dot');

        dots.forEach((dot, i) => {
            dot.classList.remove('active', 'completed');
            // Check if this puzzle index is completed
            const puzzleIds = Object.keys(puzzles);
            if (i < currentIndex || (puzzleIds[i] && puzzles[puzzleIds[i]]?.solved)) {
                dot.classList.add('completed');
            } else if (i === currentIndex) {
                dot.classList.add('active');
            }
        });
    }
}
