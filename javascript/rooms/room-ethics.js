/* ============================================
   Room 3: Ethics & Governance Archive
   ============================================ */

import BaseRoom from './base-room.js';

export default class RoomEthics extends BaseRoom {
    constructor(gameState, puzzleEngine, aiService, audioManager, progressTracker) {
        super(gameState, puzzleEngine, aiService, audioManager, progressTracker);
        this.roomId = 'ethics';
    }
}
