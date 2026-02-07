/* ============================================
   Code Lock Puzzle - Fill in Operators
   ============================================ */

import BasePuzzle from './base-puzzle.js';

export default class CodeLockPuzzle extends BasePuzzle {
    constructor(config, gameState, audioManager) {
        super(config, gameState, audioManager);
        this.selects = {};
    }

    buildPuzzle(bodyElement) {
        const { template, blanks, options } = this.config.config;

        // Build the code display with dropdowns
        let codeHtml = this._escapeHtml(template);
        const sortedBlanks = [...blanks].sort((a, b) => b.position - a.position);

        // Replace ___ with select dropdowns
        let blankIndex = blanks.length - 1;
        codeHtml = codeHtml.replace(/___/g, () => {
            const blank = blanks[blankIndex >= 0 ? blankIndex-- : 0];
            if (!blank) return '___';
            return `<select class="code-select" id="code-blank-${blank.id}" data-blank="${blank.id}">
                <option value="">???</option>
                ${options.map(o => `<option value="${this._escapeHtml(o)}">${this._escapeHtml(o)}</option>`).join('')}
            </select>`;
        });

        bodyElement.innerHTML = `
            <div class="code-lock-workspace">
                <div class="code-editor">
                    <div class="code-header">
                        <span class="code-dot" style="background:#ef4444;"></span>
                        <span class="code-dot" style="background:#f59e0b;"></span>
                        <span class="code-dot" style="background:#10b981;"></span>
                        <span style="margin-left: 8px; font-size: var(--font-size-xs); color: var(--color-text-muted);">airlock_access.js</span>
                    </div>
                    <pre class="code-content"><code>${codeHtml}</code></pre>
                </div>
                <div class="code-lock-info">
                    <p class="text-muted" style="font-size: var(--font-size-xs);">
                        Select the correct operators to complete the conditional expression.
                    </p>
                </div>
            </div>
        `;

        this._addStyles();

        // Track select elements
        blanks.forEach(blank => {
            this.selects[blank.id] = bodyElement.querySelector(`#code-blank-${blank.id}`);
        });
    }

    _addStyles() {
        if (document.getElementById('codelock-styles')) return;
        const style = document.createElement('style');
        style.id = 'codelock-styles';
        style.textContent = `
            .code-editor {
                background: #0d1117;
                border: 1px solid rgba(var(--room-accent-rgb), 0.2);
                border-radius: var(--radius-lg);
                overflow: hidden;
            }
            .code-header {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: var(--spacing-sm) var(--spacing-md);
                background: rgba(0,0,0,0.3);
                border-bottom: 1px solid rgba(255,255,255,0.05);
            }
            .code-dot {
                width: 10px;
                height: 10px;
                border-radius: 50%;
            }
            .code-content {
                padding: var(--spacing-lg);
                font-family: var(--font-mono);
                font-size: var(--font-size-base);
                line-height: 2;
                color: #e6edf3;
                overflow-x: auto;
                margin: 0;
                white-space: pre-wrap;
            }
            .code-select {
                font-family: var(--font-mono);
                font-size: var(--font-size-base);
                font-weight: 700;
                background: rgba(var(--room-accent-rgb), 0.15);
                border: 2px solid rgba(var(--room-accent-rgb), 0.5);
                border-radius: var(--radius-sm);
                color: var(--room-accent);
                padding: 2px 8px;
                cursor: pointer;
                outline: none;
                min-width: 60px;
            }
            .code-select:focus {
                border-color: var(--room-accent);
                box-shadow: 0 0 8px rgba(var(--room-accent-rgb), 0.4);
            }
            .code-select.correct {
                border-color: var(--color-success);
                background: rgba(16, 185, 129, 0.15);
                color: var(--color-success);
            }
            .code-select.incorrect {
                border-color: var(--color-error);
                background: rgba(239, 68, 68, 0.15);
                color: var(--color-error);
            }
            .code-lock-info {
                margin-top: var(--spacing-md);
            }
        `;
        document.head.appendChild(style);
    }

    getUserAnswer() {
        const answer = {};
        for (const [id, select] of Object.entries(this.selects)) {
            answer[id] = select?.value || '';
        }
        return answer;
    }

    checkAnswer(userAnswer) {
        const correct = this.config.solution.values;
        let allCorrect = true;

        for (const [id, expectedVal] of Object.entries(correct)) {
            const select = this.selects[id];
            const isCorrect = String(userAnswer[id]).trim() === String(expectedVal).trim();

            if (select) {
                select.classList.remove('correct', 'incorrect');
                select.classList.add(isCorrect ? 'correct' : 'incorrect');
            }

            if (!isCorrect) allCorrect = false;
        }

        return allCorrect;
    }

    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
