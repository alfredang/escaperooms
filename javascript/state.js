/* ============================================
   GameState - Centralized State with Pub/Sub
   ============================================ */

const STORAGE_KEY = 'aivault_save';

export class GameState {
    constructor() {
        this._listeners = {};
        this._state = this._getDefaultState();
    }

    _getDefaultState() {
        return {
            currentScreen: 'title',
            currentRoom: null,
            currentPuzzleIndex: 0,
            rooms: {
                space:  { unlocked: true,  puzzles: {}, completed: false, artifact: null },
                food:   { unlocked: false, puzzles: {}, completed: false, artifact: null },
                ethics: { unlocked: false, puzzles: {}, completed: false, artifact: null },
                green:  { unlocked: false, puzzles: {}, completed: false, artifact: null },
                cyber:  { unlocked: false, puzzles: {}, completed: false, artifact: null },
            },
            timer: { elapsed: 0, running: false, roomTimes: {} },
            hints: { total: 10, used: 0 },
            score: { points: 0, accuracy: {} },
            badges: [],
            settings: {
                aiProvider: null,
                apiKey: null,
                soundEnabled: true,
                musicEnabled: false
            },
            metaPuzzleUnlocked: false,
            gameComplete: false,
            startTime: null,
            endTime: null
        };
    }

    /* ---- State Access ---- */

    get(path) {
        if (!path) return this._state;
        const keys = path.split('.');
        let value = this._state;
        for (const key of keys) {
            if (value == null) return undefined;
            value = value[key];
        }
        return value;
    }

    set(path, value) {
        const keys = path.split('.');
        let target = this._state;
        for (let i = 0; i < keys.length - 1; i++) {
            if (target[keys[i]] == null) {
                target[keys[i]] = {};
            }
            target = target[keys[i]];
        }
        const lastKey = keys[keys.length - 1];
        const oldValue = target[lastKey];
        target[lastKey] = value;

        this.emit('stateChange', { path, value, oldValue });
        this.emit(`change:${path}`, { value, oldValue });

        // Emit parent path changes too
        if (keys.length > 1) {
            this.emit(`change:${keys[0]}`, { path, value });
        }

        this._autoSave();
    }

    /* ---- Pub/Sub ---- */

    on(event, callback) {
        if (!this._listeners[event]) {
            this._listeners[event] = [];
        }
        this._listeners[event].push(callback);
        return () => this.off(event, callback);
    }

    off(event, callback) {
        if (!this._listeners[event]) return;
        this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
    }

    emit(event, data) {
        const listeners = this._listeners[event];
        if (!listeners) return;
        for (const callback of listeners) {
            try {
                callback(data);
            } catch (err) {
                console.error(`Error in listener for "${event}":`, err);
            }
        }
    }

    /* ---- Persistence ---- */

    save() {
        try {
            const serializable = JSON.parse(JSON.stringify(this._state));
            // Don't persist API key in localStorage
            if (serializable.settings) {
                serializable.settings.apiKey = null;
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
        } catch (err) {
            console.warn('Failed to save game state:', err);
        }
    }

    load() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (!saved) return false;
            const parsed = JSON.parse(saved);
            this._state = this._mergeDeep(this._getDefaultState(), parsed);
            this.emit('stateLoaded', this._state);
            return true;
        } catch (err) {
            console.warn('Failed to load game state:', err);
            return false;
        }
    }

    hasSave() {
        return localStorage.getItem(STORAGE_KEY) !== null;
    }

    clearSave() {
        localStorage.removeItem(STORAGE_KEY);
        this._state = this._getDefaultState();
        this.emit('stateReset', this._state);
    }

    /* ---- Game Logic Helpers ---- */

    markPuzzleSolved(roomId, puzzleId, result) {
        this.set(`rooms.${roomId}.puzzles.${puzzleId}`, {
            solved: true,
            attempts: result.attempts,
            time: result.time,
            score: result.score,
            firstAttempt: result.attempts === 1
        });

        this.set('score.points', this.get('score.points') + (result.score || 0));
        this.emit('puzzleSolved', { roomId, puzzleId, result });
    }

    markRoomCompleted(roomId, artifact) {
        this.set(`rooms.${roomId}.completed`, true);
        this.set(`rooms.${roomId}.artifact`, artifact);

        // Unlock next room
        const roomOrder = ['space', 'food', 'ethics', 'green', 'cyber'];
        const currentIndex = roomOrder.indexOf(roomId);
        if (currentIndex < roomOrder.length - 1) {
            this.set(`rooms.${roomOrder[currentIndex + 1]}.unlocked`, true);
        }

        // Check if all rooms complete
        const allComplete = roomOrder.every(r => this.get(`rooms.${r}.completed`));
        if (allComplete) {
            this.set('metaPuzzleUnlocked', true);
        }

        this.emit('roomCompleted', { roomId, artifact });
    }

    useHint() {
        const used = this.get('hints.used');
        const total = this.get('hints.total');
        if (used >= total) return false;
        this.set('hints.used', used + 1);
        this.emit('hintUsed', { used: used + 1, remaining: total - used - 1 });
        return true;
    }

    getHintsRemaining() {
        return this.get('hints.total') - this.get('hints.used');
    }

    getRoomProgress(roomId) {
        const puzzles = this.get(`rooms.${roomId}.puzzles`) || {};
        const solved = Object.values(puzzles).filter(p => p.solved).length;
        return solved;
    }

    getOverallProgress() {
        const rooms = ['space', 'food', 'ethics', 'green', 'cyber'];
        let totalSolved = 0;
        let totalRooms = 0;
        for (const room of rooms) {
            if (this.get(`rooms.${room}.completed`)) totalRooms++;
            totalSolved += this.getRoomProgress(room);
        }
        return { roomsCompleted: totalRooms, totalRooms: 5, puzzlesSolved: totalSolved };
    }

    addBadge(badgeId) {
        const badges = this.get('badges') || [];
        if (!badges.includes(badgeId)) {
            badges.push(badgeId);
            this.set('badges', badges);
            this.emit('badgeEarned', { badgeId });
        }
    }

    /* ---- Internal ---- */

    _autoSave() {
        if (this._saveTimeout) clearTimeout(this._saveTimeout);
        this._saveTimeout = setTimeout(() => this.save(), 1000);
    }

    _mergeDeep(target, source) {
        const result = { ...target };
        for (const key of Object.keys(source)) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this._mergeDeep(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        return result;
    }
}
