/* ============================================
   Room 1: Space Operations AI Hub
   ============================================ */

import BaseRoom from './base-room.js';

export default class RoomSpace extends BaseRoom {
    constructor(gameState, puzzleEngine, aiService, audioManager, progressTracker) {
        super(gameState, puzzleEngine, aiService, audioManager, progressTracker);
        this.roomId = 'space';
    }
}
