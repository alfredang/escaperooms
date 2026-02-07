/* ============================================
   DragDropManager - Reusable Drag & Drop
   ============================================ */

export class DragDropManager {
    constructor(options = {}) {
        this.onDrop = options.onDrop || (() => {});
        this.onDragStart = options.onDragStart || (() => {});
        this.onDragEnd = options.onDragEnd || (() => {});
        this.dragClass = options.dragClass || 'dragging';
        this.overClass = options.overClass || 'drag-over';
        this.items = [];
        this.zones = [];
        this._draggedItem = null;

        // Touch support
        this._touchStartPos = null;
        this._touchClone = null;
    }

    registerDraggable(element, data = {}) {
        element.draggable = true;
        element.dataset.dragData = JSON.stringify(data);
        this.items.push(element);

        // Mouse drag events
        element.addEventListener('dragstart', (e) => this._handleDragStart(e, element));
        element.addEventListener('dragend', (e) => this._handleDragEnd(e, element));

        // Touch events
        element.addEventListener('touchstart', (e) => this._handleTouchStart(e, element), { passive: false });
        element.addEventListener('touchmove', (e) => this._handleTouchMove(e, element), { passive: false });
        element.addEventListener('touchend', (e) => this._handleTouchEnd(e, element));
    }

    registerDropZone(element, data = {}) {
        element.dataset.zoneData = JSON.stringify(data);
        this.zones.push(element);

        element.addEventListener('dragover', (e) => this._handleDragOver(e, element));
        element.addEventListener('dragenter', (e) => this._handleDragEnter(e, element));
        element.addEventListener('dragleave', (e) => this._handleDragLeave(e, element));
        element.addEventListener('drop', (e) => this._handleDrop(e, element));
    }

    /* ---- Mouse Drag Handlers ---- */

    _handleDragStart(e, element) {
        this._draggedItem = element;
        element.classList.add(this.dragClass);

        const data = element.dataset.dragData;
        e.dataTransfer.setData('text/plain', data);
        e.dataTransfer.effectAllowed = 'move';

        this.onDragStart(element, JSON.parse(data));
    }

    _handleDragEnd(e, element) {
        element.classList.remove(this.dragClass);
        this._draggedItem = null;

        // Remove over class from all zones
        this.zones.forEach(z => z.classList.remove(this.overClass));
        this.onDragEnd(element);
    }

    _handleDragOver(e, zone) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    _handleDragEnter(e, zone) {
        e.preventDefault();
        zone.classList.add(this.overClass);
    }

    _handleDragLeave(e, zone) {
        // Only remove if actually leaving the zone (not entering a child)
        if (!zone.contains(e.relatedTarget)) {
            zone.classList.remove(this.overClass);
        }
    }

    _handleDrop(e, zone) {
        e.preventDefault();
        zone.classList.remove(this.overClass);

        const itemData = JSON.parse(e.dataTransfer.getData('text/plain') || '{}');
        const zoneData = JSON.parse(zone.dataset.zoneData || '{}');

        this.onDrop(this._draggedItem, zone, itemData, zoneData);
    }

    /* ---- Touch Handlers (Mobile Support) ---- */

    _handleTouchStart(e, element) {
        const touch = e.touches[0];
        this._touchStartPos = { x: touch.clientX, y: touch.clientY };
        this._draggedItem = element;

        // Create visual clone for dragging
        this._touchClone = element.cloneNode(true);
        this._touchClone.style.cssText = `
            position: fixed;
            pointer-events: none;
            z-index: 1000;
            opacity: 0.8;
            transform: scale(1.05);
            left: ${touch.clientX - element.offsetWidth / 2}px;
            top: ${touch.clientY - element.offsetHeight / 2}px;
            width: ${element.offsetWidth}px;
        `;
        document.body.appendChild(this._touchClone);

        element.classList.add(this.dragClass);
        this.onDragStart(element, JSON.parse(element.dataset.dragData || '{}'));

        e.preventDefault();
    }

    _handleTouchMove(e, element) {
        if (!this._touchClone) return;
        e.preventDefault();

        const touch = e.touches[0];
        this._touchClone.style.left = `${touch.clientX - element.offsetWidth / 2}px`;
        this._touchClone.style.top = `${touch.clientY - element.offsetHeight / 2}px`;

        // Highlight drop zone under touch
        const elemUnder = document.elementFromPoint(touch.clientX, touch.clientY);
        this.zones.forEach(z => {
            if (z === elemUnder || z.contains(elemUnder)) {
                z.classList.add(this.overClass);
            } else {
                z.classList.remove(this.overClass);
            }
        });
    }

    _handleTouchEnd(e, element) {
        if (!this._touchClone) return;

        const touch = e.changedTouches[0];
        const elemUnder = document.elementFromPoint(touch.clientX, touch.clientY);

        // Find drop zone
        let targetZone = null;
        for (const zone of this.zones) {
            if (zone === elemUnder || zone.contains(elemUnder)) {
                targetZone = zone;
                break;
            }
        }

        if (targetZone) {
            const itemData = JSON.parse(element.dataset.dragData || '{}');
            const zoneData = JSON.parse(targetZone.dataset.zoneData || '{}');
            targetZone.classList.remove(this.overClass);
            this.onDrop(element, targetZone, itemData, zoneData);
        }

        // Cleanup
        this._touchClone.remove();
        this._touchClone = null;
        element.classList.remove(this.dragClass);
        this._draggedItem = null;
        this.zones.forEach(z => z.classList.remove(this.overClass));
        this.onDragEnd(element);
    }

    /* ---- Utility ---- */

    reset() {
        this.items.forEach(item => item.classList.remove(this.dragClass));
        this.zones.forEach(zone => zone.classList.remove(this.overClass));
        this._draggedItem = null;
    }

    destroy() {
        this.reset();
        if (this._touchClone) {
            this._touchClone.remove();
        }
        this.items = [];
        this.zones = [];
    }
}
