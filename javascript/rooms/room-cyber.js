/* ============================================
   Room 5: Cyber City Code Breakout
   ============================================ */

import BaseRoom from './base-room.js';

export default class RoomCyber extends BaseRoom {
    constructor(gameState, puzzleEngine, aiService, audioManager, progressTracker) {
        super(gameState, puzzleEngine, aiService, audioManager, progressTracker);
        this.roomId = 'cyber';
    }
}
