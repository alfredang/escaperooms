/* ============================================
   Recommendation Puzzle - Bias Detection in AI Recs
   ============================================ */

import BasePuzzle from './base-puzzle.js';

export default class RecommendationPuzzle extends BasePuzzle {
    constructor(config, gameState, audioManager) {
        super(config, gameState, audioManager);
        this.answers = {};
    }

    buildPuzzle(bodyElement) {
        const { recommendations, questions } = this.config.config;

        const recsHtml = recommendations.map(rec => `
            <div class="recommendation-card" data-rec="${rec.id}">
                <h4 style="color: var(--room-accent); margin-bottom: var(--spacing-sm);">${rec.title}</h4>
                <p style="font-size: var(--font-size-sm); color: var(--color-text-secondary); line-height: var(--line-height-relaxed);">
                    ${rec.text}
                </p>
            </div>
        `).join('');

        const questionsHtml = questions.map(q => `
            <div class="rec-question" data-qid="${q.id}">
                <p style="font-weight: 500; margin-bottom: var(--spacing-sm);">${q.text}</p>
                <div class="question-options">
                    ${q.options.map(opt => `
                        <label class="question-option">
                            <input type="radio" name="rec-${q.id}" value="${opt}">
                            <span>${opt}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `).join('');

        bodyElement.innerHTML = `
            <div class="recommendation-workspace">
                <div class="rec-cards">${recsHtml}</div>
                <div class="divider"></div>
                <div class="rec-questions">${questionsHtml}</div>
            </div>
        `;

        this._addStyles();

        bodyElement.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const qid = e.target.name.replace('rec-', '');
                this.answers[qid] = e.target.value;
                this.audio.play('click');
            });
        });
    }

    _addStyles() {
        if (document.getElementById('recommendation-styles')) return;
        const style = document.createElement('style');
        style.id = 'recommendation-styles';
        style.textContent = `
            .recommendation-workspace {
                display: flex;
                flex-direction: column;
                gap: var(--spacing-lg);
            }
            .rec-cards {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                gap: var(--spacing-md);
            }
            .recommendation-card {
                background: rgba(var(--room-accent-rgb), 0.05);
                border: 1px solid rgba(var(--room-accent-rgb), 0.15);
                border-radius: var(--radius-md);
                padding: var(--spacing-lg);
                transition: all var(--transition-normal);
            }
            .recommendation-card:hover {
                border-color: rgba(var(--room-accent-rgb), 0.3);
            }
            .rec-questions {
                display: flex;
                flex-direction: column;
                gap: var(--spacing-lg);
            }
            .rec-question {
                background: rgba(var(--room-accent-rgb), 0.03);
                border: 1px solid rgba(var(--room-accent-rgb), 0.1);
                border-radius: var(--radius-md);
                padding: var(--spacing-md);
            }
            .rec-question.correct { border-color: var(--color-success); background: rgba(16, 185, 129, 0.05); }
            .rec-question.incorrect { border-color: var(--color-error); background: rgba(239, 68, 68, 0.05); }
        `;
        document.head.appendChild(style);
    }

    getUserAnswer() {
        return this.answers;
    }

    checkAnswer(userAnswer) {
        const { questions } = this.config.config;
        let allCorrect = true;

        questions.forEach(q => {
            const qEl = this.container.querySelector(`[data-qid="${q.id}"]`);
            const isCorrect = userAnswer[q.id] === q.answer;

            if (qEl) {
                qEl.classList.remove('correct', 'incorrect');
                qEl.classList.add(isCorrect ? 'correct' : 'incorrect');
            }

            if (!isCorrect) allCorrect = false;
        });

        return allCorrect;
    }
}
