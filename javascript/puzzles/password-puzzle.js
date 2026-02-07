/* ============================================
   Password Puzzle - Pattern-Based Deduction
   ============================================ */

import BasePuzzle from './base-puzzle.js';

export default class PasswordPuzzle extends BasePuzzle {
    constructor(config, gameState, audioManager) {
        super(config, gameState, audioManager);
        this.currentGuess = '';
        this.guessHistory = [];
    }

    buildPuzzle(bodyElement) {
        const { rules, attempts: prevAttempts, password } = this.config.config;

        const rulesHtml = rules.map(r => `<li>${r}</li>`).join('');
        const attemptsHtml = prevAttempts.map(a => `
            <div class="attempt-entry">
                <span class="font-mono">${a.guess}</span>
                <span style="color: var(--color-warning);">${a.feedback}</span>
            </div>
        `).join('');

        bodyElement.innerHTML = `
            <div class="password-workspace">
                <div class="password-rules">
                    <h4 style="font-size: var(--font-size-sm); margin-bottom: var(--spacing-sm);">Rules</h4>
                    <ul style="list-style: disc; padding-left: var(--spacing-lg); font-size: var(--font-size-sm); color: var(--color-text-secondary); line-height: var(--line-height-relaxed);">
                        ${rulesHtml}
                    </ul>
                </div>

                <div class="attempt-log">
                    <h4 style="font-size: var(--font-size-sm); margin-bottom: var(--spacing-sm);">Previous Attempts</h4>
                    ${attemptsHtml}
                </div>

                <div class="password-display" id="password-display">
                    ${this._renderDisplay('')}
                </div>

                <div class="password-input-area">
                    <input type="text"
                        class="form-input font-mono"
                        id="password-input"
                        maxlength="${password.length}"
                        placeholder="Enter ${password.length}-digit password"
                        style="text-align: center; font-size: var(--font-size-xl); letter-spacing: 0.3em;">
                </div>

                <div id="guess-history" class="attempt-log" style="margin-top: var(--spacing-md);">
                    <h4 style="font-size: var(--font-size-sm); margin-bottom: var(--spacing-sm);">Your Attempts</h4>
                </div>
            </div>
        `;

        this._addStyles();

        // Input handling
        const input = bodyElement.querySelector('#password-input');
        if (input) {
            input.addEventListener('input', (e) => {
                this.currentGuess = e.target.value;
                bodyElement.querySelector('#password-display').innerHTML =
                    this._renderDisplay(this.currentGuess);
            });

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.submit();
                }
            });

            input.focus();
        }
    }

    _renderDisplay(guess) {
        const len = this.config.config.password.length;
        let display = '';
        for (let i = 0; i < len; i++) {
            const char = guess[i] || '_';
            display += `<span class="password-char">${char}</span>`;
        }
        return display;
    }

    _addStyles() {
        if (document.getElementById('password-styles')) return;
        const style = document.createElement('style');
        style.id = 'password-styles';
        style.textContent = `
            .password-workspace { display: flex; flex-direction: column; gap: var(--spacing-lg); max-width: 500px; margin: 0 auto; }
            .password-display {
                display: flex;
                justify-content: center;
                gap: var(--spacing-md);
                padding: var(--spacing-lg);
                background: rgba(var(--room-accent-rgb), 0.05);
                border: 1px solid rgba(var(--room-accent-rgb), 0.2);
                border-radius: var(--radius-md);
            }
            .password-char {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 48px;
                height: 56px;
                background: rgba(0,0,0,0.3);
                border: 2px solid rgba(var(--room-accent-rgb), 0.3);
                border-radius: var(--radius-md);
                font-family: var(--font-mono);
                font-size: var(--font-size-3xl);
                font-weight: 700;
                color: var(--room-accent);
            }
            .attempt-log { font-family: var(--font-mono); font-size: var(--font-size-xs); color: var(--color-text-muted); }
            .attempt-entry {
                display: flex;
                justify-content: space-between;
                padding: var(--spacing-xs) var(--spacing-sm);
                border-bottom: 1px solid rgba(var(--room-accent-rgb), 0.08);
            }
        `;
        document.head.appendChild(style);
    }

    getUserAnswer() {
        return this.currentGuess;
    }

    checkAnswer(userAnswer) {
        const correct = String(userAnswer).trim() === this.config.config.password;

        if (!correct) {
            // Add to history
            this.guessHistory.push(userAnswer);
            const historyEl = this.container.querySelector('#guess-history');
            if (historyEl) {
                const entry = document.createElement('div');
                entry.className = 'attempt-entry';
                entry.innerHTML = `
                    <span class="font-mono">${this._escapeHtml(userAnswer)}</span>
                    <span style="color: var(--color-error);">Incorrect</span>
                `;
                historyEl.appendChild(entry);
            }

            // Clear input
            const input = this.container.querySelector('#password-input');
            if (input) {
                input.value = '';
                input.focus();
            }
            this.currentGuess = '';
        }

        return correct;
    }

    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
