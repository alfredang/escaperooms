/* ============================================
   BasePuzzle - Shared Puzzle Interface
   ============================================ */

export default class BasePuzzle {
    constructor(config, gameState, audioManager) {
        this.config = config;
        this.state = gameState;
        this.audio = audioManager;
        this.container = null;
        this.attempts = 0;
        this.solved = false;
        this.startTime = Date.now();
        this.onSolvedCallback = null;
    }

    /* ---- Lifecycle ---- */

    render(parentElement) {
        this.container = document.createElement('div');
        this.container.className = 'puzzle-container animate-slide-up';
        this.container.innerHTML = `
            <div class="puzzle-header">
                <h3 class="puzzle-title">${this.config.title}</h3>
                <p class="puzzle-description">${this.config.description}</p>
            </div>
            <div class="puzzle-body" id="puzzle-body-${this.config.id}">
                <!-- Subclass fills this -->
            </div>
            <div class="puzzle-feedback" id="puzzle-feedback-${this.config.id}"></div>
            <div class="puzzle-footer">
                <div class="puzzle-info">
                    <span class="badge badge-accent">Difficulty: ${'★'.repeat(this.config.difficulty)}${'☆'.repeat(3 - this.config.difficulty)}</span>
                    <span class="text-muted" style="font-size: var(--font-size-xs);">${this.config.points} pts</span>
                </div>
                <button class="btn btn-primary" id="puzzle-submit-${this.config.id}">Submit</button>
            </div>
        `;

        parentElement.appendChild(this.container);

        // Bind submit
        const submitBtn = this.container.querySelector(`#puzzle-submit-${this.config.id}`);
        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.submit());
        }

        // Subclass builds puzzle content
        this.buildPuzzle(this.container.querySelector(`#puzzle-body-${this.config.id}`));
    }

    buildPuzzle(bodyElement) {
        // Override in subclass
        bodyElement.innerHTML = '<p class="text-muted">Puzzle not implemented</p>';
    }

    getUserAnswer() {
        // Override in subclass — return the user's current answer
        return null;
    }

    submit() {
        if (this.solved) return;

        this.attempts++;
        const answer = this.getUserAnswer();
        const correct = this.checkAnswer(answer);

        if (correct) {
            this.solved = true;
            this.onSuccess();
        } else {
            this.onFailure();
        }
    }

    checkAnswer(userAnswer) {
        // Can be overridden for custom validation
        const solution = this.config.solution;
        if (!solution) return false;

        switch (solution.type) {
            case 'exact':
                return String(userAnswer).toLowerCase().trim() === String(solution.value).toLowerCase().trim();
            case 'number':
                return Number(userAnswer) === Number(solution.value);
            case 'order':
                return JSON.stringify(userAnswer) === JSON.stringify(solution.value);
            case 'multi-value':
                if (!Array.isArray(userAnswer)) return false;
                return solution.values.every((v, i) => Number(userAnswer[i]) === Number(v));
            case 'blanks':
                if (typeof userAnswer !== 'object') return false;
                return Object.entries(solution.values).every(
                    ([key, val]) => String(userAnswer[key]).trim() === String(val).trim()
                );
            case 'multi-choice':
                if (typeof userAnswer === 'string') {
                    return userAnswer === solution.value;
                }
                return JSON.stringify([...userAnswer].sort()) === JSON.stringify([...solution.values].sort());
            default:
                return false;
        }
    }

    /* ---- Feedback ---- */

    onSuccess() {
        this.audio.play('success');
        this._showFeedback(this.config.feedback?.success || 'Correct!', 'success');

        if (this.container) {
            this.container.style.animation = 'puzzleSuccess 0.8s ease';
        }

        // Disable submit
        const submitBtn = this.container?.querySelector(`#puzzle-submit-${this.config.id}`);
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = '✓ Solved';
        }

        const elapsed = Math.round((Date.now() - this.startTime) / 1000);

        if (this.onSolvedCallback) {
            this.onSolvedCallback({
                puzzleId: this.config.id,
                attempts: this.attempts,
                time: elapsed,
                score: this._calculateScore(),
                firstAttempt: this.attempts === 1
            });
        }
    }

    onFailure() {
        this.audio.play('failure');
        this._showFeedback(
            this.config.feedback?.failure || 'Not quite right. Try again!',
            'error'
        );

        if (this.container) {
            this.container.style.animation = 'puzzleFailure 0.4s ease';
            setTimeout(() => {
                if (this.container) this.container.style.animation = '';
            }, 400);
        }
    }

    _showFeedback(message, type) {
        const el = this.container?.querySelector(`#puzzle-feedback-${this.config.id}`);
        if (!el) return;
        el.textContent = message;
        el.className = `puzzle-feedback show ${type}`;
    }

    _calculateScore() {
        const baseScore = this.config.points || 100;
        const penalty = Math.max(0, (this.attempts - 1) * 20);
        return Math.max(baseScore - penalty, 10);
    }

    /* ---- Hint Context ---- */

    getHintContext() {
        return {
            title: this.config.title,
            description: this.config.description,
            difficulty: this.config.difficulty,
            attempts: this.attempts,
            hints: this.config.hints || []
        };
    }

    /* ---- Cleanup ---- */

    reset() {
        this.attempts = 0;
        this.solved = false;
        this.startTime = Date.now();
        const el = this.container?.querySelector(`#puzzle-feedback-${this.config.id}`);
        if (el) el.className = 'puzzle-feedback';
    }

    destroy() {
        if (this.container && this.container.parentElement) {
            this.container.parentElement.removeChild(this.container);
        }
        this.container = null;
    }
}
