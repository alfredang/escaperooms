/* ============================================
   Cause-Effect Puzzle - Matching/Connection
   ============================================ */

import BasePuzzle from './base-puzzle.js';

export default class CauseEffectPuzzle extends BasePuzzle {
    constructor(config, gameState, audioManager) {
        super(config, gameState, audioManager);
        this.selectedCause = null;
        this.matches = {};
        this.shuffledEffects = [];
    }

    buildPuzzle(bodyElement) {
        const { pairs } = this.config.config;

        // Shuffle effects
        this.shuffledEffects = pairs.map((p, i) => ({ text: p.effect, originalIndex: i }));
        for (let i = this.shuffledEffects.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.shuffledEffects[i], this.shuffledEffects[j]] = [this.shuffledEffects[j], this.shuffledEffects[i]];
        }

        const causesHtml = pairs.map((p, i) => `
            <div class="match-item cause-item" data-cause="${i}" data-matched="${this.matches[i] !== undefined}">
                <span class="match-number">${i + 1}</span>
                ${p.cause}
            </div>
        `).join('');

        const effectsHtml = this.shuffledEffects.map((e, i) => `
            <div class="match-item effect-item" data-effect="${e.originalIndex}">
                <span class="match-letter">${String.fromCharCode(65 + i)}</span>
                ${e.text}
            </div>
        `).join('');

        bodyElement.innerHTML = `
            <div class="cause-effect-workspace">
                <p class="text-muted" style="font-size: var(--font-size-xs); margin-bottom: var(--spacing-md);">
                    Click a cause, then click its matching effect. Match all pairs.
                </p>
                <div class="match-columns">
                    <div>
                        <h4 style="font-size: var(--font-size-sm); margin-bottom: var(--spacing-sm); color: var(--room-accent);">Causes</h4>
                        <div class="match-list">${causesHtml}</div>
                    </div>
                    <div>
                        <h4 style="font-size: var(--font-size-sm); margin-bottom: var(--spacing-sm); color: var(--room-accent);">Effects</h4>
                        <div class="match-list">${effectsHtml}</div>
                    </div>
                </div>
                <div id="match-status" class="match-status text-muted" style="font-size: var(--font-size-xs); margin-top: var(--spacing-md);">
                    ${Object.keys(this.matches).length}/${pairs.length} matched
                </div>
            </div>
        `;

        this._addStyles();

        // Click handlers for causes
        bodyElement.querySelectorAll('.cause-item').forEach(el => {
            el.addEventListener('click', () => {
                if (el.classList.contains('matched')) return;
                // Deselect previous
                bodyElement.querySelectorAll('.cause-item').forEach(c => c.classList.remove('selected'));
                el.classList.add('selected');
                this.selectedCause = parseInt(el.dataset.cause);
                this.audio.play('click');
            });
        });

        // Click handlers for effects
        bodyElement.querySelectorAll('.effect-item').forEach(el => {
            el.addEventListener('click', () => {
                if (el.classList.contains('matched')) return;
                if (this.selectedCause === null) return;

                const effectIndex = parseInt(el.dataset.effect);
                this.matches[this.selectedCause] = effectIndex;

                // Mark both as matched
                const causeEl = bodyElement.querySelector(`[data-cause="${this.selectedCause}"]`);
                if (causeEl) {
                    causeEl.classList.add('matched');
                    causeEl.classList.remove('selected');
                }
                el.classList.add('matched');

                this.selectedCause = null;
                this.audio.play('click');

                // Update status
                const statusEl = bodyElement.querySelector('#match-status');
                if (statusEl) {
                    statusEl.textContent = `${Object.keys(this.matches).length}/${this.config.config.pairs.length} matched`;
                }
            });
        });
    }

    _addStyles() {
        if (document.getElementById('cause-effect-styles')) return;
        const style = document.createElement('style');
        style.id = 'cause-effect-styles';
        style.textContent = `
            .match-columns {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: var(--spacing-xl);
            }
            @media (max-width: 768px) { .match-columns { grid-template-columns: 1fr; } }
            .match-list { display: flex; flex-direction: column; gap: var(--spacing-sm); }
            .match-item {
                background: rgba(var(--room-accent-rgb), 0.05);
                border: 1px solid rgba(var(--room-accent-rgb), 0.15);
                border-radius: var(--radius-md);
                padding: var(--spacing-md);
                cursor: pointer;
                transition: all var(--transition-normal);
                font-size: var(--font-size-sm);
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
            }
            .match-item:hover:not(.matched) {
                border-color: rgba(var(--room-accent-rgb), 0.5);
                background: rgba(var(--room-accent-rgb), 0.1);
            }
            .match-item.selected {
                border-color: var(--room-accent);
                box-shadow: 0 0 12px rgba(var(--room-accent-rgb), 0.3);
                background: rgba(var(--room-accent-rgb), 0.12);
            }
            .match-item.matched {
                opacity: 0.6;
                border-color: var(--color-success);
                cursor: default;
            }
            .match-item.correct-match { border-color: var(--color-success); opacity: 1; }
            .match-item.incorrect-match { border-color: var(--color-error); opacity: 1; }
            .match-number, .match-letter {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 24px;
                height: 24px;
                border-radius: var(--radius-full);
                background: rgba(var(--room-accent-rgb), 0.2);
                font-family: var(--font-mono);
                font-size: var(--font-size-xs);
                font-weight: 700;
                flex-shrink: 0;
            }
        `;
        document.head.appendChild(style);
    }

    getUserAnswer() {
        // Return array of matched effect indices in cause order
        const { pairs } = this.config.config;
        return pairs.map((_, i) => this.matches[i] !== undefined ? this.matches[i] : -1);
    }

    checkAnswer(userAnswer) {
        const { pairs } = this.config.config;
        let allCorrect = true;

        pairs.forEach((_, i) => {
            const isCorrect = userAnswer[i] === i; // cause i matches effect i
            const causeEl = this.container.querySelector(`[data-cause="${i}"]`);
            const effectEl = this.container.querySelector(`[data-effect="${this.matches[i]}"]`);

            if (causeEl) {
                causeEl.classList.remove('correct-match', 'incorrect-match');
                causeEl.classList.add(isCorrect ? 'correct-match' : 'incorrect-match');
            }
            if (effectEl) {
                effectEl.classList.remove('correct-match', 'incorrect-match');
                effectEl.classList.add(isCorrect ? 'correct-match' : 'incorrect-match');
            }

            if (!isCorrect) allCorrect = false;
        });

        return allCorrect;
    }
}
