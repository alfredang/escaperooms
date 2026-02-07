/* ============================================
   Decision Tree Puzzle - Ethical Branching Scenarios
   ============================================ */

import BasePuzzle from './base-puzzle.js';

export default class DecisionTreePuzzle extends BasePuzzle {
    constructor(config, gameState, audioManager) {
        super(config, gameState, audioManager);
        this.currentNodeId = 'start';
        this.path = ['start'];
        this.finalNode = null;
    }

    buildPuzzle(bodyElement) {
        this.bodyElement = bodyElement;
        this._renderNode('start');
    }

    _renderNode(nodeId) {
        const nodes = this.config.config.nodes;
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return;

        this.currentNodeId = nodeId;

        // Build breadcrumb trail
        const breadcrumbs = this.path.map((id, i) => {
            const n = nodes.find(x => x.id === id);
            return `<span class="breadcrumb-item ${i === this.path.length - 1 ? 'active' : ''}">${i + 1}</span>`;
        }).join('<span class="breadcrumb-sep">→</span>');

        let contentHtml;

        if (node.isEnd) {
            this.finalNode = node;
            const icon = node.correct ? '✓' : '✗';
            const cls = node.correct ? 'correct' : 'incorrect';

            contentHtml = `
                <div class="decision-card decision-end ${cls}">
                    <div class="decision-result-icon">${icon}</div>
                    <p style="line-height: var(--line-height-relaxed);">${node.text}</p>
                    ${!node.correct ? `
                        <button class="btn btn-secondary btn-sm" id="dt-restart" style="margin-top: var(--spacing-md);">
                            Try Again
                        </button>
                    ` : ''}
                </div>
            `;
        } else {
            contentHtml = `
                <div class="decision-card">
                    <p style="line-height: var(--line-height-relaxed); margin-bottom: var(--spacing-lg);">
                        ${node.text}
                    </p>
                    <div class="decision-choices">
                        ${node.choices.map((choice, i) => `
                            <button class="decision-choice" data-next="${choice.next}">
                                ${choice.text}
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        this.bodyElement.innerHTML = `
            <div class="decision-tree-workspace">
                <div class="breadcrumb-trail">${breadcrumbs}</div>
                <div class="scenario-intro" style="margin-bottom: var(--spacing-lg);">
                    <p class="text-muted" style="font-size: var(--font-size-xs);">
                        ${this.config.config.scenario}
                    </p>
                </div>
                ${contentHtml}
            </div>
        `;

        this._addStyles();

        // Bind choice buttons
        this.bodyElement.querySelectorAll('.decision-choice').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const nextId = e.currentTarget.dataset.next;
                this.audio.play('click');
                this.path.push(nextId);
                this._renderNode(nextId);
            });
        });

        // Bind restart button
        const restartBtn = this.bodyElement.querySelector('#dt-restart');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                this.path = ['start'];
                this.finalNode = null;
                this.audio.play('click');
                this._renderNode('start');
            });
        }
    }

    _addStyles() {
        if (document.getElementById('decision-tree-styles')) return;
        const style = document.createElement('style');
        style.id = 'decision-tree-styles';
        style.textContent = `
            .decision-tree-workspace { max-width: 600px; margin: 0 auto; }
            .breadcrumb-trail {
                display: flex;
                align-items: center;
                gap: var(--spacing-xs);
                margin-bottom: var(--spacing-lg);
                flex-wrap: wrap;
            }
            .breadcrumb-item {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 28px;
                height: 28px;
                border-radius: var(--radius-full);
                background: rgba(var(--room-accent-rgb), 0.1);
                border: 1px solid rgba(var(--room-accent-rgb), 0.3);
                font-family: var(--font-mono);
                font-size: var(--font-size-xs);
                color: var(--color-text-muted);
            }
            .breadcrumb-item.active {
                background: var(--room-accent);
                color: #fff;
                border-color: var(--room-accent);
            }
            .breadcrumb-sep { color: var(--color-text-muted); font-size: var(--font-size-xs); }
            .decision-card {
                background: rgba(var(--room-accent-rgb), 0.05);
                border: 1px solid rgba(var(--room-accent-rgb), 0.2);
                border-radius: var(--radius-lg);
                padding: var(--spacing-xl);
                animation: fadeSlideUp var(--transition-normal) forwards;
            }
            .decision-choices {
                display: flex;
                flex-direction: column;
                gap: var(--spacing-sm);
            }
            .decision-choice {
                display: block;
                width: 100%;
                text-align: left;
                padding: var(--spacing-md);
                background: rgba(var(--room-accent-rgb), 0.05);
                border: 1px solid rgba(var(--room-accent-rgb), 0.2);
                border-radius: var(--radius-md);
                color: var(--color-text-primary);
                cursor: pointer;
                transition: all var(--transition-normal);
                font-size: var(--font-size-sm);
                line-height: var(--line-height-relaxed);
            }
            .decision-choice:hover {
                background: rgba(var(--room-accent-rgb), 0.15);
                border-color: rgba(var(--room-accent-rgb), 0.5);
                transform: translateX(4px);
            }
            .decision-end {
                text-align: center;
            }
            .decision-end.correct {
                border-color: var(--color-success);
                background: rgba(16, 185, 129, 0.08);
            }
            .decision-end.incorrect {
                border-color: var(--color-error);
                background: rgba(239, 68, 68, 0.08);
            }
            .decision-result-icon {
                font-size: 3rem;
                margin-bottom: var(--spacing-md);
            }
            .decision-end.correct .decision-result-icon { color: var(--color-success); }
            .decision-end.incorrect .decision-result-icon { color: var(--color-error); }
        `;
        document.head.appendChild(style);
    }

    getUserAnswer() {
        return this.finalNode?.id || null;
    }

    checkAnswer(userAnswer) {
        return userAnswer === 'correct-end';
    }

    // Override submit to auto-check when reaching an end node
    submit() {
        if (this.solved) return;
        if (!this.finalNode) return;

        this.attempts++;

        if (this.finalNode.correct) {
            this.solved = true;
            this.onSuccess();
        } else {
            this.onFailure();
        }
    }

    // Override to auto-submit when reaching end
    _renderNode(nodeId) {
        const nodes = this.config.config.nodes;
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return;

        // Call parent render
        this.currentNodeId = nodeId;

        // Build and render
        const breadcrumbs = this.path.map((id, i) => {
            return `<span class="breadcrumb-item ${i === this.path.length - 1 ? 'active' : ''}">${i + 1}</span>`;
        }).join('<span class="breadcrumb-sep">→</span>');

        let contentHtml;

        if (node.isEnd) {
            this.finalNode = node;
            const icon = node.correct ? '✓' : '✗';
            const cls = node.correct ? 'correct' : 'incorrect';

            contentHtml = `
                <div class="decision-card decision-end ${cls}">
                    <div class="decision-result-icon">${icon}</div>
                    <p style="line-height: var(--line-height-relaxed);">${node.text}</p>
                    ${!node.correct ? `
                        <button class="btn btn-secondary btn-sm" id="dt-restart" style="margin-top: var(--spacing-md);">
                            Try Again
                        </button>
                    ` : ''}
                </div>
            `;

            // Auto-submit after render
            setTimeout(() => this.submit(), 500);
        } else {
            contentHtml = `
                <div class="decision-card">
                    <p style="line-height: var(--line-height-relaxed); margin-bottom: var(--spacing-lg);">
                        ${node.text}
                    </p>
                    <div class="decision-choices">
                        ${node.choices.map(choice => `
                            <button class="decision-choice" data-next="${choice.next}">
                                ${choice.text}
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        this.bodyElement.innerHTML = `
            <div class="decision-tree-workspace">
                <div class="breadcrumb-trail">${breadcrumbs}</div>
                ${contentHtml}
            </div>
        `;

        // Bind choices
        this.bodyElement.querySelectorAll('.decision-choice').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const nextId = e.currentTarget.dataset.next;
                this.audio.play('click');
                this.path.push(nextId);
                this._renderNode(nextId);
            });
        });

        const restartBtn = this.bodyElement.querySelector('#dt-restart');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                this.path = ['start'];
                this.finalNode = null;
                this.audio.play('click');
                this._renderNode('start');
            });
        }
    }

    render(parentElement) {
        this.container = document.createElement('div');
        this.container.className = 'puzzle-container animate-slide-up';
        this.container.innerHTML = `
            <div class="puzzle-header">
                <h3 class="puzzle-title">${this.config.title}</h3>
                <p class="puzzle-description">${this.config.description}</p>
            </div>
            <div class="puzzle-body" id="puzzle-body-${this.config.id}"></div>
            <div class="puzzle-feedback" id="puzzle-feedback-${this.config.id}"></div>
            <div class="puzzle-footer">
                <div class="puzzle-info">
                    <span class="badge badge-accent">Difficulty: ${'★'.repeat(this.config.difficulty)}${'☆'.repeat(3 - this.config.difficulty)}</span>
                </div>
            </div>
        `;

        parentElement.appendChild(this.container);
        this.bodyElement = this.container.querySelector(`#puzzle-body-${this.config.id}`);
        this.buildPuzzle(this.bodyElement);
    }
}
