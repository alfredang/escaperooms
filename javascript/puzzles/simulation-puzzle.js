/* ============================================
   Simulation Puzzle - Climate Parameter Sliders
   ============================================ */

import BasePuzzle from './base-puzzle.js';

export default class SimulationPuzzle extends BasePuzzle {
    constructor(config, gameState, audioManager) {
        super(config, gameState, audioManager);
        this.sliderValues = {};
    }

    buildPuzzle(bodyElement) {
        const { sliders, outputs } = this.config.config;

        sliders.forEach(s => { this.sliderValues[s.id] = s.default; });

        const slidersHtml = sliders.map(s => `
            <div class="sim-slider-group">
                <div class="sim-slider-header">
                    <label>${s.label}</label>
                    <span class="font-mono text-accent" id="simval-${s.id}">${s.default}${s.unit}</span>
                </div>
                <input type="range" id="simslider-${s.id}" min="${s.min}" max="${s.max}" value="${s.default}" data-slider="${s.id}">
            </div>
        `).join('');

        const outputsHtml = outputs.map(o => `
            <div class="sim-metric" id="metric-${o.id}">
                <div class="sim-metric-label">${o.label}</div>
                <div class="sim-metric-value" id="metricval-${o.id}">--</div>
                <div class="sim-metric-target text-muted" style="font-size: var(--font-size-xs);">
                    Target: ${o.target.min ? `≥ ${o.target.min}` : ''}${o.target.max ? `≤ ${o.target.max}` : ''}${o.unit}
                </div>
            </div>
        `).join('');

        bodyElement.innerHTML = `
            <div class="simulation-workspace">
                <div class="sim-controls">
                    <h4 style="font-size: var(--font-size-sm); margin-bottom: var(--spacing-md);">Parameters</h4>
                    ${slidersHtml}
                </div>
                <div class="sim-results">
                    <h4 style="font-size: var(--font-size-sm); margin-bottom: var(--spacing-md);">Projected Outcomes</h4>
                    <div class="sim-output">${outputsHtml}</div>
                </div>
            </div>
        `;

        this._addStyles();

        sliders.forEach(s => {
            const slider = bodyElement.querySelector(`#simslider-${s.id}`);
            if (slider) {
                slider.addEventListener('input', (e) => {
                    this.sliderValues[s.id] = Number(e.target.value);
                    bodyElement.querySelector(`#simval-${s.id}`).textContent = `${e.target.value}${s.unit}`;
                    this._updateOutputs();
                });
            }
        });

        this._updateOutputs();
    }

    _updateOutputs() {
        const { outputs } = this.config.config;

        outputs.forEach(o => {
            const value = this._evaluateFormula(o.formula);
            const rounded = Math.round(value * 100) / 100;

            const valEl = this.container.querySelector(`#metricval-${o.id}`);
            const metricEl = this.container.querySelector(`#metric-${o.id}`);

            let met = true;
            if (o.target.min !== undefined && value < o.target.min) met = false;
            if (o.target.max !== undefined && value > o.target.max) met = false;

            if (valEl) {
                valEl.textContent = `${rounded}${o.unit}`;
                valEl.classList.remove('good', 'bad');
                valEl.classList.add(met ? 'good' : 'bad');
            }
        });
    }

    _evaluateFormula(formula) {
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
        if (document.getElementById('simulation-styles')) return;
        const style = document.createElement('style');
        style.id = 'simulation-styles';
        style.textContent = `
            .simulation-workspace {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: var(--spacing-xl);
            }
            @media (max-width: 768px) { .simulation-workspace { grid-template-columns: 1fr; } }
            .sim-slider-group { margin-bottom: var(--spacing-lg); }
            .sim-slider-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: var(--spacing-sm);
                font-size: var(--font-size-sm);
            }
            .sim-output { display: flex; flex-direction: column; gap: var(--spacing-md); }
            .sim-metric {
                background: rgba(var(--room-accent-rgb), 0.05);
                border: 1px solid rgba(var(--room-accent-rgb), 0.15);
                border-radius: var(--radius-md);
                padding: var(--spacing-md);
            }
            .sim-metric-label {
                font-family: var(--font-display);
                font-size: var(--font-size-xs);
                text-transform: uppercase;
                letter-spacing: 0.1em;
                color: var(--color-text-muted);
                margin-bottom: var(--spacing-xs);
            }
            .sim-metric-value {
                font-family: var(--font-mono);
                font-size: var(--font-size-2xl);
                font-weight: 700;
                transition: color var(--transition-normal);
            }
            .sim-metric-value.good { color: var(--color-success); }
            .sim-metric-value.bad { color: var(--color-error); }
        `;
        document.head.appendChild(style);
    }

    getUserAnswer() {
        return this.sliderValues;
    }

    checkAnswer() {
        const { outputs } = this.config.config;
        return outputs.every(o => {
            const value = this._evaluateFormula(o.formula);
            let met = true;
            if (o.target.min !== undefined && value < o.target.min) met = false;
            if (o.target.max !== undefined && value > o.target.max) met = false;
            return met;
        });
    }
}
