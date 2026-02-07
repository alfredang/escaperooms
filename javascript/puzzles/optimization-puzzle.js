/* ============================================
   Optimization Puzzle - Slider Constraints
   ============================================ */

import BasePuzzle from './base-puzzle.js';

export default class OptimizationPuzzle extends BasePuzzle {
    constructor(config, gameState, audioManager) {
        super(config, gameState, audioManager);
        this.sliderValues = {};
    }

    buildPuzzle(bodyElement) {
        const { sliders, constraints } = this.config.config;

        // Initialize default values
        sliders.forEach(s => { this.sliderValues[s.id] = s.default; });

        const slidersHtml = sliders.map(s => `
            <div class="opt-slider-group">
                <div class="opt-slider-header">
                    <label for="slider-${s.id}">${s.label}</label>
                    <span class="opt-slider-value font-mono" id="val-${s.id}">${s.default}${s.unit}</span>
                </div>
                <input type="range" id="slider-${s.id}" min="${s.min}" max="${s.max}" value="${s.default}" data-slider="${s.id}">
            </div>
        `).join('');

        const constraintsHtml = constraints.map(c => `
            <div class="constraint-indicator unmet" id="constraint-${c.id}">
                <span class="constraint-icon">✗</span>
                <span class="constraint-label">${c.label}</span>
                <span class="constraint-value font-mono" id="cval-${c.id}">--</span>
            </div>
        `).join('');

        bodyElement.innerHTML = `
            <div class="optimization-workspace">
                <div class="opt-sliders">${slidersHtml}</div>
                <div class="opt-constraints">
                    <h4 style="font-size: var(--font-size-sm); margin-bottom: var(--spacing-sm);">Constraints</h4>
                    ${constraintsHtml}
                </div>
            </div>
        `;

        this._addStyles();

        // Bind slider events
        sliders.forEach(s => {
            const slider = bodyElement.querySelector(`#slider-${s.id}`);
            if (slider) {
                slider.addEventListener('input', (e) => {
                    this.sliderValues[s.id] = Number(e.target.value);
                    bodyElement.querySelector(`#val-${s.id}`).textContent = `${e.target.value}${s.unit}`;
                    this._updateConstraints();
                });
            }
        });

        this._updateConstraints();
    }

    _updateConstraints() {
        const { constraints } = this.config.config;

        constraints.forEach(c => {
            const value = this._evaluateFormula(c.formula);
            const met = value >= c.min && value <= c.max;

            const el = this.container.querySelector(`#constraint-${c.id}`);
            const valEl = this.container.querySelector(`#cval-${c.id}`);

            if (el) {
                el.classList.remove('met', 'unmet');
                el.classList.add(met ? 'met' : 'unmet');
                el.querySelector('.constraint-icon').textContent = met ? '✓' : '✗';
            }
            if (valEl) {
                valEl.textContent = Math.round(value * 10) / 10;
            }
        });
    }

    _evaluateFormula(formula) {
        // Safely evaluate formula by replacing variable names with values
        let expr = formula;
        for (const [key, val] of Object.entries(this.sliderValues)) {
            expr = expr.replace(new RegExp(`\\b${key}\\b`, 'g'), val);
        }
        try {
            return Function(`"use strict"; return (${expr})`)();
        } catch {
            return 0;
        }
    }

    _addStyles() {
        if (document.getElementById('optimization-styles')) return;
        const style = document.createElement('style');
        style.id = 'optimization-styles';
        style.textContent = `
            .optimization-workspace {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: var(--spacing-xl);
            }
            @media (max-width: 768px) {
                .optimization-workspace { grid-template-columns: 1fr; }
            }
            .opt-slider-group {
                margin-bottom: var(--spacing-lg);
            }
            .opt-slider-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: var(--spacing-sm);
                font-size: var(--font-size-sm);
            }
            .opt-slider-value {
                color: var(--room-accent);
                font-weight: 600;
            }
            .opt-constraints {
                background: rgba(var(--room-accent-rgb), 0.03);
                border: 1px solid rgba(var(--room-accent-rgb), 0.1);
                border-radius: var(--radius-md);
                padding: var(--spacing-lg);
            }
            .constraint-indicator {
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
                padding: var(--spacing-sm);
                border-radius: var(--radius-sm);
                font-size: var(--font-size-sm);
                margin-bottom: var(--spacing-xs);
                transition: color var(--transition-fast);
            }
            .constraint-indicator.met { color: var(--color-success); }
            .constraint-indicator.unmet { color: var(--color-error); }
            .constraint-icon { font-weight: 700; min-width: 16px; }
            .constraint-label { flex: 1; }
            .constraint-value { opacity: 0.7; }
        `;
        document.head.appendChild(style);
    }

    getUserAnswer() {
        return this.sliderValues;
    }

    checkAnswer() {
        const { constraints } = this.config.config;
        return constraints.every(c => {
            const value = this._evaluateFormula(c.formula);
            return value >= c.min && value <= c.max;
        });
    }
}
