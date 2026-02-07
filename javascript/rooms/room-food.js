/* ============================================
   Room 2: Smart Food Systems Lab
   ============================================ */

import BaseRoom from './base-room.js';

export default class RoomFood extends BaseRoom {
    constructor(gameState, puzzleEngine, aiService, audioManager, progressTracker) {
        super(gameState, puzzleEngine, aiService, audioManager, progressTracker);
        this.roomId = 'food';
    }
}
