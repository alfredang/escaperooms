/* ============================================
   Pattern Puzzle - Sequence Prediction
   ============================================ */

import BasePuzzle from './base-puzzle.js';

export default class PatternPuzzle extends BasePuzzle {
    constructor(config, gameState, audioManager) {
        super(config, gameState, audioManager);
        this.inputs = [];
    }

    buildPuzzle(bodyElement) {
        const { sequences } = this.config.config;

        bodyElement.innerHTML = `
            <div class="pattern-workspace">
                <div class="terminal-display">
                    ${sequences.map((seq, i) => `
                        <div class="sequence-row" data-seq="${i}">
                            <div class="sequence-label">SEQUENCE ${String.fromCharCode(65 + i)}</div>
                            <div class="sequence-numbers">
                                ${seq.input.map(n => `<span class="seq-num">${n}</span>`).join('<span class="seq-arrow">→</span>')}
                                <span class="seq-arrow">→</span>
                                <input type="number"
                                    class="seq-input"
                                    id="seq-input-${i}"
                                    placeholder="?"
                                    aria-label="Next value in sequence ${String.fromCharCode(65 + i)}">
                            </div>
                            <div class="sequence-feedback" id="seq-feedback-${i}"></div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        this._addStyles();

        this.inputs = sequences.map((_, i) =>
            bodyElement.querySelector(`#seq-input-${i}`)
        );
    }

    _addStyles() {
        if (document.getElementById('pattern-styles')) return;
        const style = document.createElement('style');
        style.id = 'pattern-styles';
        style.textContent = `
            .terminal-display {
                background: #0d1117;
                border: 1px solid rgba(6, 182, 212, 0.2);
                border-radius: var(--radius-md);
                padding: var(--spacing-lg);
                font-family: var(--font-mono);
            }
            .sequence-row {
                margin-bottom: var(--spacing-lg);
                padding-bottom: var(--spacing-lg);
                border-bottom: 1px solid rgba(255,255,255,0.05);
            }
            .sequence-row:last-child {
                margin-bottom: 0;
                padding-bottom: 0;
                border-bottom: none;
            }
            .sequence-label {
                font-size: var(--font-size-xs);
                color: var(--room-accent);
                letter-spacing: 0.15em;
                margin-bottom: var(--spacing-sm);
                opacity: 0.7;
            }
            .sequence-numbers {
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: var(--spacing-sm);
            }
            .seq-num {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-width: 44px;
                height: 44px;
                background: rgba(var(--room-accent-rgb), 0.1);
                border: 1px solid rgba(var(--room-accent-rgb), 0.3);
                border-radius: var(--radius-md);
                font-size: var(--font-size-lg);
                font-weight: 600;
                color: var(--color-text-primary);
                padding: 0 var(--spacing-sm);
            }
            .seq-arrow {
                color: var(--color-text-muted);
                font-size: var(--font-size-lg);
            }
            .seq-input {
                width: 60px;
                height: 44px;
                text-align: center;
                font-family: var(--font-mono);
                font-size: var(--font-size-lg);
                font-weight: 600;
                background: rgba(var(--room-accent-rgb), 0.05);
                border: 2px dashed rgba(var(--room-accent-rgb), 0.4);
                border-radius: var(--radius-md);
                color: var(--room-accent);
                -moz-appearance: textfield;
            }
            .seq-input::-webkit-inner-spin-button,
            .seq-input::-webkit-outer-spin-button {
                -webkit-appearance: none;
                margin: 0;
            }
            .seq-input:focus {
                border-style: solid;
                border-color: var(--room-accent);
                box-shadow: 0 0 10px rgba(var(--room-accent-rgb), 0.3);
                outline: none;
            }
            .seq-input.correct {
                border-color: var(--color-success);
                border-style: solid;
                color: var(--color-success);
            }
            .seq-input.incorrect {
                border-color: var(--color-error);
                border-style: solid;
                color: var(--color-error);
            }
            .sequence-feedback {
                font-size: var(--font-size-xs);
                margin-top: var(--spacing-xs);
                min-height: 1em;
            }
        `;
        document.head.appendChild(style);
    }

    getUserAnswer() {
        return this.inputs.map(input => {
            const val = input?.value?.trim();
            return val !== '' ? Number(val) : null;
        });
    }

    checkAnswer(userAnswer) {
        const { sequences } = this.config.config;
        let allCorrect = true;

        sequences.forEach((seq, i) => {
            const input = this.inputs[i];
            const feedbackEl = this.container.querySelector(`#seq-feedback-${i}`);
            const correct = userAnswer[i] === seq.answer;

            if (input) {
                input.classList.remove('correct', 'incorrect');
                input.classList.add(correct ? 'correct' : 'incorrect');
            }

            if (feedbackEl) {
                if (correct) {
                    feedbackEl.innerHTML = `<span style="color: var(--color-success);">✓ ${seq.rule}</span>`;
                } else {
                    feedbackEl.innerHTML = `<span style="color: var(--color-error);">✗ Try again</span>`;
                    allCorrect = false;
                }
            }

            if (!correct) allCorrect = false;
        });

        return allCorrect;
    }
}
