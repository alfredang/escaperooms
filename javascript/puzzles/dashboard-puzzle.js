/* ============================================
   Dashboard Puzzle - Chart Interpretation
   ============================================ */

import BasePuzzle from './base-puzzle.js';

export default class DashboardPuzzle extends BasePuzzle {
    constructor(config, gameState, audioManager) {
        super(config, gameState, audioManager);
        this.answers = {};
    }

    buildPuzzle(bodyElement) {
        const { charts, questions } = this.config.config;

        const chartsHtml = charts.map(chart => this._renderChart(chart)).join('');
        const questionsHtml = questions.map(q => `
            <div class="dashboard-question" data-qid="${q.id}">
                <p style="font-weight: 500; margin-bottom: var(--spacing-sm);">${q.text}</p>
                <div class="question-options">
                    ${q.options.map(opt => `
                        <label class="question-option">
                            <input type="radio" name="q-${q.id}" value="${opt}">
                            <span>${opt}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `).join('');

        bodyElement.innerHTML = `
            <div class="dashboard-workspace">
                <div class="dashboard-charts">${chartsHtml}</div>
                <div class="dashboard-questions">${questionsHtml}</div>
            </div>
        `;

        this._addStyles();

        // Track radio changes
        bodyElement.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const qid = e.target.name.replace('q-', '');
                this.answers[qid] = e.target.value;
                this.audio.play('click');
            });
        });
    }

    _renderChart(chart) {
        if (chart.type === 'bar') {
            const maxVal = Math.max(...chart.data.map(d => d.value));
            const bars = chart.data.map(d => {
                const height = Math.round((d.value / maxVal) * 180);
                return `<div class="bar-col">
                    <div class="bar" style="height: ${height}px" data-value="${d.value}"></div>
                    <div class="bar-label">${d.label}</div>
                </div>`;
            }).join('');

            return `<div class="chart-container">
                <div class="chart-title">${chart.title}</div>
                <div class="bar-chart">${bars}</div>
            </div>`;
        }
        return '';
    }

    _addStyles() {
        if (document.getElementById('dashboard-styles')) return;
        const style = document.createElement('style');
        style.id = 'dashboard-styles';
        style.textContent = `
            .dashboard-workspace {
                display: flex;
                flex-direction: column;
                gap: var(--spacing-xl);
            }
            .chart-container {
                background: rgba(var(--room-accent-rgb), 0.05);
                border: 1px solid rgba(var(--room-accent-rgb), 0.15);
                border-radius: var(--radius-md);
                padding: var(--spacing-lg);
            }
            .chart-title {
                font-family: var(--font-display);
                font-size: var(--font-size-sm);
                color: var(--color-text-secondary);
                text-transform: uppercase;
                letter-spacing: 0.1em;
                margin-bottom: var(--spacing-md);
            }
            .bar-chart {
                display: flex;
                align-items: flex-end;
                justify-content: center;
                gap: var(--spacing-lg);
                height: 220px;
                padding: var(--spacing-md) 0;
                border-bottom: 1px solid rgba(var(--room-accent-rgb), 0.2);
            }
            .bar-col { text-align: center; flex: 1; max-width: 80px; }
            .bar {
                width: 100%;
                background: linear-gradient(to top, rgba(var(--room-accent-rgb), 0.5), rgba(var(--room-accent-rgb), 0.9));
                border-radius: var(--radius-sm) var(--radius-sm) 0 0;
                position: relative;
                transition: height 0.6s ease;
                min-height: 4px;
            }
            .bar::after {
                content: attr(data-value);
                position: absolute;
                top: -22px;
                left: 50%;
                transform: translateX(-50%);
                font-family: var(--font-mono);
                font-size: var(--font-size-xs);
                color: var(--color-text-secondary);
                white-space: nowrap;
            }
            .bar-label {
                font-size: var(--font-size-xs);
                color: var(--color-text-muted);
                margin-top: var(--spacing-sm);
            }
            .dashboard-questions {
                display: flex;
                flex-direction: column;
                gap: var(--spacing-lg);
            }
            .dashboard-question {
                background: rgba(var(--room-accent-rgb), 0.03);
                border: 1px solid rgba(var(--room-accent-rgb), 0.1);
                border-radius: var(--radius-md);
                padding: var(--spacing-md);
            }
            .question-options {
                display: flex;
                flex-direction: column;
                gap: var(--spacing-xs);
            }
            .question-option {
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
                padding: var(--spacing-xs) var(--spacing-sm);
                border-radius: var(--radius-sm);
                cursor: pointer;
                font-size: var(--font-size-sm);
                transition: background var(--transition-fast);
            }
            .question-option:hover {
                background: rgba(var(--room-accent-rgb), 0.05);
            }
            .question-option input[type="radio"] {
                accent-color: var(--room-accent);
            }
            .dashboard-question.correct {
                border-color: var(--color-success);
                background: rgba(16, 185, 129, 0.05);
            }
            .dashboard-question.incorrect {
                border-color: var(--color-error);
                background: rgba(239, 68, 68, 0.05);
            }
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
