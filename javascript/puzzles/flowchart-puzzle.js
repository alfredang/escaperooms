/* ============================================
   Flowchart Puzzle - Drag & Drop Algorithm Blocks
   ============================================ */

import BasePuzzle from './base-puzzle.js';
import { DragDropManager } from '../drag-drop.js';

export default class FlowchartPuzzle extends BasePuzzle {
    constructor(config, gameState, audioManager) {
        super(config, gameState, audioManager);
        this.dragDrop = null;
        this.placedOrder = [];
    }

    buildPuzzle(bodyElement) {
        const { blocks, correctOrder } = this.config.config;

        // Shuffle blocks (but keep them all available)
        const shuffled = [...blocks].sort(() => Math.random() - 0.5);

        bodyElement.innerHTML = `
            <div class="flowchart-workspace">
                <div class="flowchart-tray">
                    <p class="text-muted" style="font-size: var(--font-size-xs); margin-bottom: var(--spacing-sm);">
                        Drag blocks into the correct order:
                    </p>
                    <div id="block-tray" class="block-tray">
                        ${shuffled.map(b => `
                            <div class="flowchart-block ${b.type}" data-block-id="${b.id}" draggable="true">
                                <span class="block-type-label">${b.type.toUpperCase()}</span>
                                ${b.text}
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="flowchart-target">
                    <p class="text-muted" style="font-size: var(--font-size-xs); margin-bottom: var(--spacing-sm);">
                        Algorithm sequence (drop here):
                    </p>
                    <div id="drop-zone" class="drop-zone">
                        ${correctOrder.map((_, i) => `
                            <div class="drop-slot" data-slot="${i}">
                                <span class="slot-number">${i + 1}</span>
                                <span class="slot-placeholder">Drop block here</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        this._addStyles();
        this._setupDragDrop();
    }

    _addStyles() {
        if (document.getElementById('flowchart-styles')) return;
        const style = document.createElement('style');
        style.id = 'flowchart-styles';
        style.textContent = `
            .flowchart-workspace {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: var(--spacing-xl);
                min-height: 300px;
            }
            @media (max-width: 768px) {
                .flowchart-workspace { grid-template-columns: 1fr; }
            }
            .block-tray, .drop-zone {
                display: flex;
                flex-direction: column;
                gap: var(--spacing-sm);
            }
            .flowchart-block {
                padding: var(--spacing-sm) var(--spacing-md);
                border-radius: var(--radius-md);
                font-size: var(--font-size-sm);
                cursor: grab;
                transition: all var(--transition-fast);
                user-select: none;
                position: relative;
                background: var(--color-bg-card);
                border: 1px solid var(--color-border);
            }
            .flowchart-block:hover {
                transform: translateY(-1px);
                box-shadow: var(--shadow-md);
            }
            .flowchart-block.dragging {
                opacity: 0.5;
                cursor: grabbing;
            }
            .block-type-label {
                display: inline-block;
                font-family: var(--font-mono);
                font-size: 9px;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                padding: 1px 6px;
                border-radius: 3px;
                margin-right: var(--spacing-sm);
                opacity: 0.7;
            }
            .flowchart-block.terminal .block-type-label { background: rgba(6, 182, 212, 0.2); color: #06b6d4; }
            .flowchart-block.decision .block-type-label { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
            .flowchart-block.process .block-type-label { background: rgba(16, 185, 129, 0.2); color: #10b981; }
            .drop-slot {
                min-height: 48px;
                border: 2px dashed var(--color-border);
                border-radius: var(--radius-md);
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
                padding: var(--spacing-sm) var(--spacing-md);
                transition: all var(--transition-fast);
            }
            .drop-slot.drag-over {
                border-color: var(--room-accent);
                background: rgba(var(--room-accent-rgb), 0.1);
            }
            .drop-slot.filled {
                border-style: solid;
                border-color: rgba(var(--room-accent-rgb), 0.4);
                background: rgba(var(--room-accent-rgb), 0.05);
            }
            .drop-slot.correct {
                border-color: var(--color-success);
                background: rgba(16, 185, 129, 0.05);
            }
            .drop-slot.incorrect {
                border-color: var(--color-error);
                background: rgba(239, 68, 68, 0.05);
            }
            .slot-number {
                font-family: var(--font-mono);
                font-size: var(--font-size-xs);
                color: var(--color-text-muted);
                min-width: 20px;
            }
            .slot-placeholder {
                color: var(--color-text-muted);
                font-size: var(--font-size-xs);
            }
            .slot-content {
                font-size: var(--font-size-sm);
            }
        `;
        document.head.appendChild(style);
    }

    _setupDragDrop() {
        this.placedOrder = new Array(this.config.config.correctOrder.length).fill(null);

        this.dragDrop = new DragDropManager({
            onDrop: (item, zone, itemData, zoneData) => {
                this._handleBlockDrop(item, zone, itemData, zoneData);
            }
        });

        // Register draggable blocks
        const blocks = this.container.querySelectorAll('.flowchart-block');
        blocks.forEach(block => {
            this.dragDrop.registerDraggable(block, { id: block.dataset.blockId });
        });

        // Register drop slots
        const slots = this.container.querySelectorAll('.drop-slot');
        slots.forEach(slot => {
            this.dragDrop.registerDropZone(slot, { slot: parseInt(slot.dataset.slot) });
        });
    }

    _handleBlockDrop(item, zone, itemData, zoneData) {
        const slotIndex = zoneData.slot;
        const blockId = itemData.id;

        // If slot already has a block, return it to tray
        if (this.placedOrder[slotIndex]) {
            this._returnBlockToTray(this.placedOrder[slotIndex]);
        }

        // Place block in slot
        this.placedOrder[slotIndex] = blockId;
        const block = this.config.config.blocks.find(b => b.id === blockId);

        zone.classList.add('filled');
        zone.innerHTML = `
            <span class="slot-number">${slotIndex + 1}</span>
            <span class="slot-content">${block.text}</span>
        `;

        // Hide the block from tray
        if (item) {
            item.style.display = 'none';
        }

        this.audio.play('click');
    }

    _returnBlockToTray(blockId) {
        const block = this.container.querySelector(`[data-block-id="${blockId}"]`);
        if (block) {
            block.style.display = '';
        }
    }

    getUserAnswer() {
        // Filter out null entries and return the order
        return this.placedOrder.filter(id => id !== null);
    }

    checkAnswer(userAnswer) {
        const correct = this.config.solution.value;
        if (userAnswer.length !== correct.length) return false;

        // Show per-slot feedback
        const slots = this.container.querySelectorAll('.drop-slot');
        let allCorrect = true;

        for (let i = 0; i < correct.length; i++) {
            if (userAnswer[i] === correct[i]) {
                slots[i]?.classList.add('correct');
                slots[i]?.classList.remove('incorrect');
            } else {
                slots[i]?.classList.add('incorrect');
                slots[i]?.classList.remove('correct');
                allCorrect = false;
            }
        }

        return allCorrect;
    }

    destroy() {
        if (this.dragDrop) {
            this.dragDrop.destroy();
        }
        super.destroy();
    }
}
