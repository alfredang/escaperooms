/* ============================================
   Room 4: Green Tech & Sustainability Core
   ============================================ */

import BaseRoom from './base-room.js';

export default class RoomGreen extends BaseRoom {
    constructor(gameState, puzzleEngine, aiService, audioManager, progressTracker) {
        super(gameState, puzzleEngine, aiService, audioManager, progressTracker);
        this.roomId = 'green';
    }
}
