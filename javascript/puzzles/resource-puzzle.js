/* ============================================
   Resource Puzzle - Budget Allocation Optimizer
   ============================================ */

import BasePuzzle from './base-puzzle.js';

export default class ResourcePuzzle extends BasePuzzle {
    constructor(config, gameState, audioManager) {
        super(config, gameState, audioManager);
        this.allocations = {};
    }

    buildPuzzle(bodyElement) {
        const { budget, initiatives, targetScore } = this.config.config;

        initiatives.forEach(init => { this.allocations[init.id] = 0; });

        const cardsHtml = initiatives.map(init => `
            <div class="resource-card" data-init="${init.id}">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: var(--spacing-sm);">
                    <div>
                        <h4 style="font-size: var(--font-size-sm);">${init.name}</h4>
                        <p class="text-muted" style="font-size: var(--font-size-xs);">${init.description}</p>
                    </div>
                    <span class="font-mono text-accent" id="alloc-${init.id}">0</span>
                </div>
                <input type="range" id="res-slider-${init.id}" min="0" max="${budget}" step="25" value="0" data-init="${init.id}">
                <div style="display: flex; justify-content: space-between; font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 4px;">
                    <span>Impact: <span class="font-mono" id="impact-${init.id}">0</span></span>
                    <span>Rate: ${init.impactPerUnit}/credit (diminishes at ${init.diminishingAt})</span>
                </div>
            </div>
        `).join('');

        bodyElement.innerHTML = `
            <div class="resource-workspace">
                <div class="budget-header">
                    <div class="budget-display">
                        Budget: <span id="budget-remaining">${budget}</span> / ${budget}
                    </div>
                    <div class="score-display" style="text-align: center; margin-bottom: var(--spacing-lg);">
                        <span class="text-muted" style="font-size: var(--font-size-xs);">Total Impact</span>
                        <div class="font-mono" style="font-size: var(--font-size-3xl); font-weight: 700;" id="total-score">0</div>
                        <span class="text-muted" style="font-size: var(--font-size-xs);">Target: ${targetScore}+</span>
                    </div>
                </div>
                <div class="resource-cards">${cardsHtml}</div>
            </div>
        `;

        this._addStyles();

        initiatives.forEach(init => {
            const slider = bodyElement.querySelector(`#res-slider-${init.id}`);
            if (slider) {
                slider.addEventListener('input', (e) => {
                    this._handleSliderChange(init.id, Number(e.target.value));
                });
            }
        });
    }

    _handleSliderChange(initId, value) {
        const { budget, initiatives } = this.config.config;

        // Calculate total of all OTHER allocations
        let othersTotal = 0;
        for (const [id, val] of Object.entries(this.allocations)) {
            if (id !== initId) othersTotal += val;
        }

        // Cap this slider so total doesn't exceed budget
        const maxForThis = budget - othersTotal;
        const capped = Math.min(value, maxForThis);

        this.allocations[initId] = capped;

        // Update slider if capped
        const slider = this.container.querySelector(`#res-slider-${initId}`);
        if (slider && capped !== value) {
            slider.value = capped;
        }

        // Update display
        this.container.querySelector(`#alloc-${initId}`).textContent = capped;

        // Calculate impact with diminishing returns
        const init = initiatives.find(i => i.id === initId);
        const impact = this._calcImpact(capped, init);
        this.container.querySelector(`#impact-${initId}`).textContent = Math.round(impact);

        // Update totals
        let totalUsed = 0;
        let totalImpact = 0;
        for (const [id, val] of Object.entries(this.allocations)) {
            totalUsed += val;
            const i = initiatives.find(x => x.id === id);
            totalImpact += this._calcImpact(val, i);
        }

        this.container.querySelector('#budget-remaining').textContent = budget - totalUsed;
        const scoreEl = this.container.querySelector('#total-score');
        scoreEl.textContent = Math.round(totalImpact);
        scoreEl.style.color = totalImpact >= this.config.config.targetScore
            ? 'var(--color-success)' : 'var(--color-text-primary)';
    }

    _calcImpact(allocation, initiative) {
        if (!initiative || allocation === 0) return 0;
        const { impactPerUnit, diminishingAt } = initiative;

        if (allocation <= diminishingAt) {
            return allocation * impactPerUnit;
        } else {
            const normalPart = diminishingAt * impactPerUnit;
            const excessPart = (allocation - diminishingAt) * impactPerUnit * 0.3;
            return normalPart + excessPart;
        }
    }

    _addStyles() {
        if (document.getElementById('resource-styles')) return;
        const style = document.createElement('style');
        style.id = 'resource-styles';
        style.textContent = `
            .resource-workspace { display: flex; flex-direction: column; gap: var(--spacing-lg); }
            .budget-display {
                font-family: var(--font-mono);
                font-size: var(--font-size-xl);
                color: var(--room-accent);
                text-align: center;
                margin-bottom: var(--spacing-sm);
            }
            .resource-cards { display: flex; flex-direction: column; gap: var(--spacing-md); }
            .resource-card {
                background: rgba(var(--room-accent-rgb), 0.03);
                border: 1px solid rgba(var(--room-accent-rgb), 0.12);
                border-radius: var(--radius-md);
                padding: var(--spacing-md);
            }
        `;
        document.head.appendChild(style);
    }

    getUserAnswer() {
        return this.allocations;
    }

    checkAnswer() {
        const { initiatives, targetScore } = this.config.config;
        let totalImpact = 0;
        for (const [id, val] of Object.entries(this.allocations)) {
            const init = initiatives.find(i => i.id === id);
            totalImpact += this._calcImpact(val, init);
        }
        return totalImpact >= targetScore;
    }
}
