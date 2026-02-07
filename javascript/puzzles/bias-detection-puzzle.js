/* ============================================
   Bias Detection Puzzle - Spot Bias in Datasets
   ============================================ */

import BasePuzzle from './base-puzzle.js';

export default class BiasDetectionPuzzle extends BasePuzzle {
    constructor(config, gameState, audioManager) {
        super(config, gameState, audioManager);
        this.selectedColumns = new Set();
        this.answers = {};
    }

    buildPuzzle(bodyElement) {
        const { dataset, questions } = this.config.config;

        const headerHtml = dataset.columns.map((col, i) => `
            <th class="bias-col-header ${this.selectedColumns.has(col) ? 'selected' : ''}"
                data-col="${col}" data-col-index="${i}">
                ${col}
            </th>
        `).join('');

        const rowsHtml = dataset.rows.map((row, ri) => `
            <tr>
                ${row.map((cell, ci) => `<td>${cell}</td>`).join('')}
            </tr>
        `).join('');

        const questionsHtml = questions.map(q => {
            if (q.answers) {
                // Multi-select (checkboxes)
                return `
                    <div class="bias-question" data-qid="${q.id}">
                        <p style="font-weight: 500; margin-bottom: var(--spacing-sm);">${q.text}</p>
                        <div class="question-options">
                            ${q.options.map(opt => `
                                <label class="question-option">
                                    <input type="checkbox" name="bias-${q.id}" value="${opt}">
                                    <span>${opt}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                `;
            } else {
                // Single select (radio)
                return `
                    <div class="bias-question" data-qid="${q.id}">
                        <p style="font-weight: 500; margin-bottom: var(--spacing-sm);">${q.text}</p>
                        <div class="question-options">
                            ${q.options.map(opt => `
                                <label class="question-option">
                                    <input type="radio" name="bias-${q.id}" value="${opt}">
                                    <span>${opt}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
        }).join('');

        bodyElement.innerHTML = `
            <div class="bias-detection-workspace">
                <div class="table-container">
                    <table class="bias-table">
                        <thead><tr>${headerHtml}</tr></thead>
                        <tbody>${rowsHtml}</tbody>
                    </table>
                </div>
                <p class="text-muted" style="font-size: var(--font-size-xs); margin: var(--spacing-sm) 0;">
                    Click column headers to highlight potential bias. Then answer the questions below.
                </p>
                <div class="bias-questions">${questionsHtml}</div>
            </div>
        `;

        this._addStyles();

        // Column click highlighting
        bodyElement.querySelectorAll('.bias-col-header').forEach(th => {
            th.addEventListener('click', () => {
                const col = th.dataset.col;
                if (this.selectedColumns.has(col)) {
                    this.selectedColumns.delete(col);
                    th.classList.remove('selected');
                } else {
                    this.selectedColumns.add(col);
                    th.classList.add('selected');
                }
                this._highlightColumns(bodyElement);
                this.audio.play('click');
            });
        });

        // Track answers
        bodyElement.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(input => {
            input.addEventListener('change', () => {
                this._collectAnswers(bodyElement);
            });
        });
    }

    _highlightColumns(bodyElement) {
        const table = bodyElement.querySelector('.bias-table');
        const headers = table.querySelectorAll('th');
        const selectedIndices = new Set();

        headers.forEach((th, i) => {
            if (this.selectedColumns.has(th.dataset.col)) {
                selectedIndices.add(i);
            }
        });

        table.querySelectorAll('tbody td').forEach(td => {
            const cellIndex = td.cellIndex;
            td.classList.toggle('highlight-bias', selectedIndices.has(cellIndex));
        });
    }

    _collectAnswers(bodyElement) {
        const { questions } = this.config.config;
        questions.forEach(q => {
            if (q.answers) {
                const checked = [...bodyElement.querySelectorAll(`input[name="bias-${q.id}"]:checked`)];
                this.answers[q.id] = checked.map(c => c.value).join(',');
            } else {
                const checked = bodyElement.querySelector(`input[name="bias-${q.id}"]:checked`);
                this.answers[q.id] = checked?.value || '';
            }
        });
    }

    _addStyles() {
        if (document.getElementById('bias-styles')) return;
        const style = document.createElement('style');
        style.id = 'bias-styles';
        style.textContent = `
            .bias-detection-workspace { display: flex; flex-direction: column; gap: var(--spacing-lg); }
            .table-container { overflow-x: auto; }
            .bias-table { width: 100%; border-collapse: collapse; font-size: var(--font-size-sm); }
            .bias-table th {
                background: rgba(var(--room-accent-rgb), 0.1);
                padding: var(--spacing-sm) var(--spacing-md);
                text-align: left;
                font-family: var(--font-display);
                font-size: var(--font-size-xs);
                text-transform: uppercase;
                letter-spacing: 0.1em;
                border-bottom: 1px solid rgba(var(--room-accent-rgb), 0.2);
                cursor: pointer;
                transition: all var(--transition-fast);
                user-select: none;
            }
            .bias-table th:hover { background: rgba(var(--room-accent-rgb), 0.2); }
            .bias-table th.selected {
                background: rgba(239, 68, 68, 0.2);
                color: var(--color-error);
                border-bottom-color: var(--color-error);
            }
            .bias-table td {
                padding: var(--spacing-sm) var(--spacing-md);
                border-bottom: 1px solid rgba(var(--room-accent-rgb), 0.05);
                transition: background var(--transition-fast);
            }
            .bias-table td.highlight-bias {
                background: rgba(239, 68, 68, 0.08);
            }
            .bias-table tr:hover td { background: rgba(var(--room-accent-rgb), 0.03); }
            .bias-questions { display: flex; flex-direction: column; gap: var(--spacing-lg); }
            .bias-question {
                background: rgba(var(--room-accent-rgb), 0.03);
                border: 1px solid rgba(var(--room-accent-rgb), 0.1);
                border-radius: var(--radius-md);
                padding: var(--spacing-md);
            }
            .bias-question.correct { border-color: var(--color-success); }
            .bias-question.incorrect { border-color: var(--color-error); }
        `;
        document.head.appendChild(style);
    }

    getUserAnswer() {
        return this.answers;
    }

    checkAnswer(userAnswer) {
        const solution = this.config.solution.values;
        let allCorrect = true;

        for (const [key, expected] of Object.entries(solution)) {
            const qEl = this.container.querySelector(`[data-qid="${key}"]`);
            const isCorrect = String(userAnswer[key]).trim() === String(expected).trim();

            if (qEl) {
                qEl.classList.remove('correct', 'incorrect');
                qEl.classList.add(isCorrect ? 'correct' : 'incorrect');
            }

            if (!isCorrect) allCorrect = false;
        }

        return allCorrect;
    }
}
