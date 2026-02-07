/* ============================================
   Timer - Elapsed Timer with Pause/Resume
   ============================================ */

export class Timer {
    constructor(gameState) {
        this.state = gameState;
        this.intervalId = null;
        this.element = null;
    }

    bind(element) {
        this.element = element;
        this._render();
    }

    start() {
        if (this.intervalId) return;
        if (!this.state.get('startTime')) {
            this.state.set('startTime', Date.now());
        }
        this.state.set('timer.running', true);

        this.intervalId = setInterval(() => {
            const elapsed = this.state.get('timer.elapsed') + 1;
            this.state.set('timer.elapsed', elapsed);
            this._render();
        }, 1000);
    }

    pause() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.state.set('timer.running', false);
    }

    resume() {
        if (!this.intervalId) {
            this.start();
        }
    }

    stop() {
        this.pause();
        this.state.set('endTime', Date.now());
    }

    reset() {
        this.pause();
        this.state.set('timer.elapsed', 0);
        this.state.set('startTime', null);
        this.state.set('endTime', null);
        this._render();
    }

    getElapsed() {
        return this.state.get('timer.elapsed') || 0;
    }

    getFormatted() {
        return Timer.format(this.getElapsed());
    }

    startRoomTimer(roomId) {
        const roomTimes = this.state.get('timer.roomTimes') || {};
        if (!roomTimes[roomId]) {
            roomTimes[roomId] = { start: this.getElapsed(), end: null };
            this.state.set('timer.roomTimes', roomTimes);
        }
    }

    stopRoomTimer(roomId) {
        const roomTimes = this.state.get('timer.roomTimes') || {};
        if (roomTimes[roomId]) {
            roomTimes[roomId].end = this.getElapsed();
            this.state.set('timer.roomTimes', roomTimes);
        }
    }

    getRoomTime(roomId) {
        const roomTimes = this.state.get('timer.roomTimes') || {};
        const rt = roomTimes[roomId];
        if (!rt) return 0;
        const end = rt.end || this.getElapsed();
        return end - rt.start;
    }

    _render() {
        if (this.element) {
            this.element.textContent = this.getFormatted();
        }
    }

    static format(totalSeconds) {
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        const pad = n => String(n).padStart(2, '0');
        return hrs > 0
            ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}`
            : `${pad(mins)}:${pad(secs)}`;
    }
}
