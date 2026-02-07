/* ============================================
   Crossword Puzzle - AI Ethics Vocabulary Grid
   ============================================ */

import BasePuzzle from './base-puzzle.js';

export default class CrosswordPuzzle extends BasePuzzle {
    constructor(config, gameState, audioManager) {
        super(config, gameState, audioManager);
        this.grid = [];
        this.size = config.config.size || 15;
        this.cells = {};
    }

    buildPuzzle(bodyElement) {
        const { words, size } = this.config.config;
        this.size = size;

        // Build the grid
        this.grid = Array.from({ length: size }, () => Array(size).fill(null));

        // Place words
        words.forEach(w => {
            for (let i = 0; i < w.word.length; i++) {
                const row = w.direction === 'across' ? w.row : w.row + i;
                const col = w.direction === 'across' ? w.col + i : w.col;
                if (row < size && col < size) {
                    this.grid[row][col] = {
                        letter: w.word[i],
                        wordId: w.word,
                        editable: true
                    };
                }
            }
        });

        // Render grid
        const gridHtml = this.grid.map((row, ri) =>
            row.map((cell, ci) => {
                if (cell) {
                    return `<input type="text"
                        class="crossword-cell"
                        maxlength="1"
                        data-row="${ri}"
                        data-col="${ci}"
                        data-letter="${cell.letter}"
                        autocomplete="off"
                        autocapitalize="characters">`;
                } else {
                    return `<div class="crossword-cell black"></div>`;
                }
            }).join('')
        ).join('');

        // Clues
        const acrossClues = words.filter(w => w.direction === 'across').map(w =>
            `<li><strong>${w.row + 1}-A:</strong> ${w.clue}</li>`
        ).join('');

        const downClues = words.filter(w => w.direction === 'down').map(w =>
            `<li><strong>${w.row + 1}-D:</strong> ${w.clue}</li>`
        ).join('');

        bodyElement.innerHTML = `
            <div class="crossword-workspace">
                <div class="crossword-grid" style="grid-template-columns: repeat(${size}, 36px);">
                    ${gridHtml}
                </div>
                <div class="crossword-clues">
                    <div class="clue-section">
                        <h4 style="font-size: var(--font-size-sm); margin-bottom: var(--spacing-sm);">Across</h4>
                        <ol class="clue-list">${acrossClues}</ol>
                    </div>
                    <div class="clue-section">
                        <h4 style="font-size: var(--font-size-sm); margin-bottom: var(--spacing-sm);">Down</h4>
                        <ol class="clue-list">${downClues}</ol>
                    </div>
                </div>
            </div>
        `;

        this._addStyles();

        // Cell navigation
        bodyElement.querySelectorAll('.crossword-cell[data-letter]').forEach(input => {
            input.addEventListener('input', (e) => {
                const val = e.target.value.toUpperCase();
                e.target.value = val;
                if (val) this._moveToNext(e.target);
            });

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value) {
                    this._moveToPrev(e.target);
                } else if (e.key === 'ArrowRight') {
                    this._moveToNext(e.target);
                } else if (e.key === 'ArrowLeft') {
                    this._moveToPrev(e.target);
                } else if (e.key === 'ArrowDown') {
                    this._moveVertical(e.target, 1);
                } else if (e.key === 'ArrowUp') {
                    this._moveVertical(e.target, -1);
                }
            });
        });
    }

    _moveToNext(current) {
        const row = parseInt(current.dataset.row);
        const col = parseInt(current.dataset.col);
        const next = this.bodyElement || this.container;
        const nextCell = next.querySelector(`[data-row="${row}"][data-col="${col + 1}"][data-letter]`) ||
                         next.querySelector(`[data-row="${row + 1}"][data-col="${0}"][data-letter]`);
        if (nextCell) nextCell.focus();
    }

    _moveToPrev(current) {
        const row = parseInt(current.dataset.row);
        const col = parseInt(current.dataset.col);
        const next = this.bodyElement || this.container;
        const prevCell = next.querySelector(`[data-row="${row}"][data-col="${col - 1}"][data-letter]`);
        if (prevCell) prevCell.focus();
    }

    _moveVertical(current, direction) {
        const row = parseInt(current.dataset.row);
        const col = parseInt(current.dataset.col);
        const next = this.bodyElement || this.container;
        const targetCell = next.querySelector(`[data-row="${row + direction}"][data-col="${col}"][data-letter]`);
        if (targetCell) targetCell.focus();
    }

    _addStyles() {
        if (document.getElementById('crossword-styles')) return;
        const style = document.createElement('style');
        style.id = 'crossword-styles';
        style.textContent = `
            .crossword-workspace {
                display: grid;
                grid-template-columns: auto 1fr;
                gap: var(--spacing-xl);
                align-items: start;
            }
            @media (max-width: 768px) {
                .crossword-workspace { grid-template-columns: 1fr; }
                .crossword-grid { overflow-x: auto; }
            }
            .crossword-grid {
                display: inline-grid;
                gap: 2px;
                background: rgba(var(--room-accent-rgb), 0.1);
                border: 1px solid rgba(var(--room-accent-rgb), 0.2);
                border-radius: var(--radius-md);
                padding: 2px;
            }
            .crossword-cell {
                width: 36px;
                height: 36px;
                text-align: center;
                font-family: var(--font-mono);
                font-weight: 700;
                font-size: var(--font-size-base);
                text-transform: uppercase;
                background: rgba(var(--room-accent-rgb), 0.03);
                border: 1px solid rgba(var(--room-accent-rgb), 0.15);
                color: var(--color-text-primary);
                padding: 0;
                border-radius: 2px;
            }
            .crossword-cell:focus {
                border-color: var(--room-accent);
                box-shadow: 0 0 8px rgba(var(--room-accent-rgb), 0.4);
                outline: none;
                background: rgba(var(--room-accent-rgb), 0.08);
            }
            .crossword-cell.black {
                background: rgba(0, 0, 0, 0.4);
                border-color: transparent;
            }
            .crossword-cell.correct {
                border-color: var(--color-success);
                color: var(--color-success);
                background: rgba(16, 185, 129, 0.08);
            }
            .crossword-cell.incorrect {
                border-color: var(--color-error);
                color: var(--color-error);
                background: rgba(239, 68, 68, 0.08);
            }
            .crossword-clues {
                display: flex;
                flex-direction: column;
                gap: var(--spacing-lg);
            }
            .clue-list {
                list-style: none;
                font-size: var(--font-size-sm);
                color: var(--color-text-secondary);
                line-height: var(--line-height-relaxed);
            }
            .clue-list li { margin-bottom: var(--spacing-xs); }
            .clue-list strong {
                color: var(--room-accent);
                font-family: var(--font-mono);
                font-size: var(--font-size-xs);
            }
        `;
        document.head.appendChild(style);
    }

    getUserAnswer() {
        const cells = this.container.querySelectorAll('.crossword-cell[data-letter]');
        const answers = {};
        cells.forEach(cell => {
            const key = `${cell.dataset.row}-${cell.dataset.col}`;
            answers[key] = (cell.value || '').toUpperCase();
        });
        return answers;
    }

    checkAnswer() {
        const cells = this.container.querySelectorAll('.crossword-cell[data-letter]');
        let allCorrect = true;

        cells.forEach(cell => {
            const expected = cell.dataset.letter.toUpperCase();
            const actual = (cell.value || '').toUpperCase();
            const correct = actual === expected;

            cell.classList.remove('correct', 'incorrect');
            if (actual) {
                cell.classList.add(correct ? 'correct' : 'incorrect');
            }

            if (!correct) allCorrect = false;
        });

        return allCorrect;
    }
}
