/* ============================================
   PuzzleEngine - JSON Loader & Puzzle Registry
   ============================================ */

export class PuzzleEngine {
    constructor(gameState) {
        this.state = gameState;
        this.puzzleData = null;
        this.roomConfigs = {};
    }

    async loadPuzzles() {
        try {
            const response = await fetch('./data/puzzles.json');
            this.puzzleData = await response.json();

            // Index rooms by id for fast lookup
            for (const room of this.puzzleData.rooms) {
                this.roomConfigs[room.id] = room;
            }

            return this.puzzleData;
        } catch (err) {
            console.error('Failed to load puzzles.json:', err);
            return null;
        }
    }

    getRoomConfig(roomId) {
        return this.roomConfigs[roomId] || null;
    }

    getPuzzlesForRoom(roomId) {
        const room = this.roomConfigs[roomId];
        if (!room) return [];
        return room.puzzles.sort((a, b) => a.order - b.order);
    }

    getPuzzleConfig(roomId, puzzleId) {
        const puzzles = this.getPuzzlesForRoom(roomId);
        return puzzles.find(p => p.id === puzzleId) || null;
    }

    getMetaPuzzleConfig() {
        return this.puzzleData?.metaPuzzle || null;
    }

    getGameConfig() {
        return this.puzzleData?.gameConfig || {};
    }

    getCharacterConfig(characterId) {
        return this.puzzleData?.characters?.[characterId] || null;
    }

    /* ---- Puzzle Type Registry ---- */

    static PUZZLE_TYPES = {
        'flowchart': () => import('./puzzles/flowchart-puzzle.js'),
        'pattern': () => import('./puzzles/pattern-puzzle.js'),
        'code-lock': () => import('./puzzles/code-lock-puzzle.js'),
        'dashboard': () => import('./puzzles/dashboard-puzzle.js'),
        'optimization': () => import('./puzzles/optimization-puzzle.js'),
        'recommendation': () => import('./puzzles/recommendation-puzzle.js'),
        'decision-tree': () => import('./puzzles/decision-tree-puzzle.js'),
        'bias-detection': () => import('./puzzles/bias-detection-puzzle.js'),
        'crossword': () => import('./puzzles/crossword-puzzle.js'),
        'simulation': () => import('./puzzles/simulation-puzzle.js'),
        'cause-effect': () => import('./puzzles/cause-effect-puzzle.js'),
        'resource': () => import('./puzzles/resource-puzzle.js'),
        'debug': () => import('./puzzles/debug-puzzle.js'),
        'password': () => import('./puzzles/password-puzzle.js'),
        'prompt': () => import('./puzzles/prompt-puzzle.js'),
    };

    async createPuzzle(puzzleConfig, gameState, audioManager) {
        const loader = PuzzleEngine.PUZZLE_TYPES[puzzleConfig.type];
        if (!loader) {
            console.error(`Unknown puzzle type: ${puzzleConfig.type}`);
            return null;
        }

        try {
            const module = await loader();
            const PuzzleClass = module.default;
            return new PuzzleClass(puzzleConfig, gameState, audioManager);
        } catch (err) {
            console.error(`Failed to load puzzle type "${puzzleConfig.type}":`, err);
            return null;
        }
    }

    validateAnswer(puzzleConfig, userAnswer) {
        const solution = puzzleConfig.solution;
        if (!solution) return false;

        switch (solution.type) {
            case 'exact':
                return String(userAnswer).toLowerCase().trim() === String(solution.value).toLowerCase().trim();

            case 'number':
                return Number(userAnswer) === Number(solution.value);

            case 'range':
                const num = Number(userAnswer);
                return num >= solution.min && num <= solution.max;

            case 'order':
                if (!Array.isArray(userAnswer)) return false;
                return JSON.stringify(userAnswer) === JSON.stringify(solution.value);

            case 'multi-value':
                if (!Array.isArray(userAnswer)) return false;
                return solution.values.every((v, i) => Number(userAnswer[i]) === Number(v));

            case 'blanks':
                if (typeof userAnswer !== 'object') return false;
                return Object.entries(solution.values).every(
                    ([key, val]) => String(userAnswer[key]).trim() === String(val).trim()
                );

            case 'multi-choice':
                if (!Array.isArray(userAnswer)) return false;
                const correct = solution.values.sort();
                const answer = [...userAnswer].sort();
                return JSON.stringify(correct) === JSON.stringify(answer);

            case 'grid':
                if (!Array.isArray(userAnswer)) return false;
                return JSON.stringify(userAnswer) === JSON.stringify(solution.grid);

            default:
                console.warn(`Unknown solution type: ${solution.type}`);
                return false;
        }
    }
}
