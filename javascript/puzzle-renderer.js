/* ============================================
   PuzzleRenderer - DOM Factory for Puzzle Types
   (Wrapper that delegates to PuzzleEngine.createPuzzle)
   ============================================ */

export class PuzzleRenderer {
    constructor(puzzleEngine) {
        this.puzzleEngine = puzzleEngine;
    }

    async renderPuzzle(puzzleConfig, parentElement, gameState, audioManager) {
        const puzzle = await this.puzzleEngine.createPuzzle(puzzleConfig, gameState, audioManager);
        if (puzzle) {
            puzzle.render(parentElement);
        }
        return puzzle;
    }
}
