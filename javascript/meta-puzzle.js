/* ============================================
   Meta Puzzle - Final Vault Challenge
   ============================================ */

export default class MetaPuzzle {
    constructor(gameState, audioManager, progressTracker) {
        this.state = gameState;
        this.audio = audioManager;
        this.progress = progressTracker;
        this.container = null;
        this.currentStep = 0;
        this.answers = {};
        this.steps = [];
    }

    async enter(containerElement) {
        this.container = containerElement;

        // Load meta puzzle config
        try {
            const response = await fetch('./data/puzzles.json');
            const data = await response.json();
            this.steps = data.metaPuzzle.steps;
        } catch (err) {
            console.error('Failed to load meta puzzle config:', err);
            this.container.innerHTML = '<p class="text-muted">Failed to load puzzle data.</p>';
            return;
        }

        this._render();
    }

    _render() {
        const artifacts = this._getArtifacts();

        const artifactsHtml = artifacts.map((a, i) => `
            <div class="vault-artifact ${this.answers[i] !== undefined ? 'placed' : ''}" data-index="${i}">
                <div class="artifact-icon">${this._getArtifactIcon(i)}</div>
                <div class="artifact-name">${a?.name || 'Unknown'}</div>
            </div>
        `).join('');

        const stepsHtml = this.steps.map((step, i) => {
            const isActive = i === this.currentStep;
            const isComplete = this.answers[i] !== undefined;
            const isLocked = i > this.currentStep;

            return `
                <div class="vault-step ${isActive ? 'active' : ''} ${isComplete ? 'complete' : ''} ${isLocked ? 'locked' : ''}"
                     data-step="${i}">
                    <div class="step-number">${isComplete ? '✓' : i + 1}</div>
                    <div class="step-content">
                        <p class="step-instruction">${step.instruction}</p>
                        ${isActive ? this._renderInput(step, i) : ''}
                        ${isComplete ? `<p class="step-answer font-mono text-accent">${this.answers[i]}</p>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        this.container.innerHTML = `
            <div class="meta-puzzle-workspace text-center">
                <div class="vault-header animate-slide-up">
                    <h2>🔐 The AI Vault</h2>
                    <p class="text-muted" style="margin-top: var(--spacing-sm);">
                        Enter the clues from each artifact to unlock the final vault.
                    </p>
                </div>

                <div class="vault-artifacts">${artifactsHtml}</div>

                <div class="vault-lock animate-pulse-glow">
                    <div class="lock-cylinders">
                        ${this.steps.map((_, i) =>
                            `<div class="lock-cylinder ${this.answers[i] !== undefined ? 'turned' : ''}" data-cyl="${i}"></div>`
                        ).join('')}
                    </div>
                </div>

                <div class="vault-steps text-left">${stepsHtml}</div>
            </div>
        `;

        this._addStyles();
        this._bindInputs();
    }

    _renderInput(step, index) {
        switch (step.inputType) {
            case 'text':
                return `
                    <div class="step-input-area">
                        <input type="text" class="form-input font-mono" id="meta-input-${index}"
                            placeholder="${step.placeholder || 'Enter answer'}"
                            autocomplete="off">
                        <button class="btn btn-primary btn-sm" id="meta-submit-${index}">Submit</button>
                    </div>
                `;
            case 'number':
                return `
                    <div class="step-input-area">
                        <input type="number" class="form-input font-mono" id="meta-input-${index}"
                            placeholder="${step.placeholder || 'Enter number'}">
                        <button class="btn btn-primary btn-sm" id="meta-submit-${index}">Submit</button>
                    </div>
                `;
            case 'choice':
                return `
                    <div class="step-input-area">
                        <div class="step-choices">
                            ${step.options.map(opt => `
                                <button class="btn btn-secondary btn-sm meta-choice" data-step="${index}" data-value="${opt}">
                                    ${opt}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                `;
            case 'slider':
                return `
                    <div class="step-input-area">
                        <div style="display: flex; align-items: center; gap: var(--spacing-md);">
                            <input type="range" id="meta-input-${index}"
                                min="${step.min}" max="${step.max}" value="${Math.round((step.min + step.max) / 2)}">
                            <span class="font-mono text-accent" id="meta-slider-val-${index}">
                                ${Math.round((step.min + step.max) / 2)}
                            </span>
                        </div>
                        <button class="btn btn-primary btn-sm" id="meta-submit-${index}" style="margin-top: var(--spacing-sm);">Submit</button>
                    </div>
                `;
            default:
                return '';
        }
    }

    _bindInputs() {
        const index = this.currentStep;
        const step = this.steps[index];
        if (!step) return;

        // Submit button
        const submitBtn = this.container.querySelector(`#meta-submit-${index}`);
        if (submitBtn) {
            submitBtn.addEventListener('click', () => this._submitStep(index));
        }

        // Enter key for text/number inputs
        const input = this.container.querySelector(`#meta-input-${index}`);
        if (input) {
            input.focus();
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this._submitStep(index);
            });

            // Slider value display
            if (step.inputType === 'slider') {
                input.addEventListener('input', (e) => {
                    const valEl = this.container.querySelector(`#meta-slider-val-${index}`);
                    if (valEl) valEl.textContent = e.target.value;
                });
            }
        }

        // Choice buttons
        this.container.querySelectorAll(`.meta-choice[data-step="${index}"]`).forEach(btn => {
            btn.addEventListener('click', (e) => {
                const value = e.currentTarget.dataset.value;
                this._checkStep(index, value);
            });
        });
    }

    _submitStep(index) {
        const step = this.steps[index];
        const input = this.container.querySelector(`#meta-input-${index}`);
        if (!input) return;
        this._checkStep(index, input.value);
    }

    _checkStep(index, userValue) {
        const step = this.steps[index];
        let correct = false;

        if (step.inputType === 'slider') {
            const tolerance = step.tolerance || 0;
            const numVal = Number(userValue);
            correct = Math.abs(numVal - step.answer) <= tolerance;
        } else if (step.inputType === 'number') {
            correct = Number(userValue) === Number(step.answer);
        } else {
            correct = String(userValue).trim().toUpperCase() === String(step.answer).toUpperCase();
        }

        if (correct) {
            this.answers[index] = userValue;
            this.audio.play('lock');

            this.currentStep++;

            if (this.currentStep >= this.steps.length) {
                // All steps complete — vault opens!
                setTimeout(() => this._openVault(), 800);
            } else {
                this._render();
            }
        } else {
            this.audio.play('failure');

            const stepEl = this.container.querySelector(`[data-step="${index}"]`);
            if (stepEl) {
                stepEl.style.animation = 'puzzleFailure 0.4s ease';
                setTimeout(() => {
                    if (stepEl) stepEl.style.animation = '';
                }, 400);
            }
        }
    }

    _openVault() {
        this.audio.play('vault');

        this.container.innerHTML = `
            <div class="vault-open-animation text-center animate-slide-up">
                <div class="vault-door-open">🏆</div>
                <h1 style="margin-top: var(--spacing-xl);">VAULT UNLOCKED</h1>
                <p class="text-muted" style="margin-top: var(--spacing-md); max-width: 500px; margin-left: auto; margin-right: auto;">
                    Congratulations! You've proven your mastery of AI, data, ethics, sustainability, and coding.
                    You've escaped The AI Vault.
                </p>
                <button class="btn btn-primary btn-lg" id="btn-show-results" style="margin-top: var(--spacing-2xl);">
                    View Results
                </button>
            </div>
        `;

        this._addVaultStyles();

        this.container.querySelector('#btn-show-results')?.addEventListener('click', () => {
            window.app?.showEndScreen();
        });
    }

    _getArtifacts() {
        const rooms = ['space', 'food', 'ethics', 'green', 'cyber'];
        return rooms.map(r => this.state.get(`rooms.${r}.artifact`));
    }

    _getArtifactIcon(index) {
        const icons = ['🔑', '📊', '⚖️', '🌱', '🔐'];
        return icons[index] || '❓';
    }

    _addStyles() {
        if (document.getElementById('meta-styles')) return;
        const style = document.createElement('style');
        style.id = 'meta-styles';
        style.textContent = `
            .meta-puzzle-workspace { max-width: 600px; margin: 0 auto; }
            .vault-artifacts {
                display: flex;
                justify-content: center;
                gap: var(--spacing-md);
                margin: var(--spacing-xl) 0;
                flex-wrap: wrap;
            }
            .vault-artifact {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: var(--spacing-xs);
                padding: var(--spacing-sm);
                opacity: 0.4;
                transition: all var(--transition-normal);
            }
            .vault-artifact.placed { opacity: 1; }
            .artifact-icon { font-size: 2rem; }
            .artifact-name { font-size: var(--font-size-xs); color: var(--color-text-muted); }
            .vault-lock {
                margin: var(--spacing-lg) auto;
                padding: var(--spacing-md);
            }
            .lock-cylinders {
                display: flex;
                justify-content: center;
                gap: var(--spacing-sm);
            }
            .lock-cylinder {
                width: 40px;
                height: 40px;
                border: 2px solid var(--color-border);
                border-radius: var(--radius-full);
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all var(--transition-slow);
            }
            .lock-cylinder::after { content: '🔒'; font-size: 1rem; }
            .lock-cylinder.turned {
                border-color: var(--color-success);
                background: rgba(16, 185, 129, 0.1);
                animation: lockTurn 0.5s ease forwards;
            }
            .lock-cylinder.turned::after { content: '🔓'; }
            .vault-steps {
                display: flex;
                flex-direction: column;
                gap: var(--spacing-md);
                margin-top: var(--spacing-xl);
            }
            .vault-step {
                display: flex;
                gap: var(--spacing-md);
                padding: var(--spacing-md);
                border: 1px solid var(--color-border);
                border-radius: var(--radius-md);
                transition: all var(--transition-normal);
            }
            .vault-step.active {
                border-color: var(--room-accent);
                background: rgba(var(--room-accent-rgb), 0.05);
            }
            .vault-step.complete {
                border-color: var(--color-success);
                background: rgba(16, 185, 129, 0.05);
            }
            .vault-step.locked { opacity: 0.4; }
            .step-number {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 32px;
                height: 32px;
                border-radius: var(--radius-full);
                background: rgba(var(--room-accent-rgb), 0.1);
                font-family: var(--font-mono);
                font-weight: 700;
                font-size: var(--font-size-sm);
                flex-shrink: 0;
            }
            .vault-step.complete .step-number {
                background: var(--color-success);
                color: #fff;
            }
            .step-content { flex: 1; }
            .step-instruction { font-size: var(--font-size-sm); margin-bottom: var(--spacing-sm); }
            .step-answer { font-size: var(--font-size-sm); opacity: 0.7; }
            .step-input-area {
                display: flex;
                gap: var(--spacing-sm);
                align-items: center;
                flex-wrap: wrap;
                margin-top: var(--spacing-sm);
            }
            .step-input-area .form-input { flex: 1; min-width: 150px; }
            .step-choices { display: flex; gap: var(--spacing-sm); flex-wrap: wrap; }
        `;
        document.head.appendChild(style);
    }

    _addVaultStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .vault-door-open {
                font-size: 6rem;
                animation: float 2s ease-in-out infinite;
            }
            .vault-open-animation h1 {
                color: var(--color-success);
                animation: pulseGlow 2s ease-in-out infinite;
            }
        `;
        document.head.appendChild(style);
    }
}
