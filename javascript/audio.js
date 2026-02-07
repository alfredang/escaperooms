/* ============================================
   AudioManager - Web Audio API Sound Effects
   ============================================ */

export class AudioManager {
    constructor(gameState) {
        this.state = gameState;
        this.ctx = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (err) {
            console.warn('Web Audio API not supported:', err);
        }
    }

    _ensureContext() {
        if (!this.initialized) this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        return this.ctx;
    }

    isEnabled() {
        return this.state.get('settings.soundEnabled') !== false;
    }

    /* ---- Sound Effects ---- */

    play(soundName) {
        if (!this.isEnabled()) return;
        const ctx = this._ensureContext();
        if (!ctx) return;

        const sounds = {
            click: () => this._playTone(800, 0.05, 'square', 0.15),
            success: () => this._playSuccessChime(),
            failure: () => this._playFailureBuzz(),
            hint: () => this._playTone(600, 0.15, 'sine', 0.2),
            unlock: () => this._playUnlockSound(),
            transition: () => this._playSwoosh(),
            badge: () => this._playBadgeSound(),
            tick: () => this._playTone(1000, 0.02, 'sine', 0.05),
            lock: () => this._playLockTurn(),
            vault: () => this._playVaultOpen(),
            type: () => this._playTone(400 + Math.random() * 200, 0.02, 'square', 0.05),
        };

        const playFn = sounds[soundName];
        if (playFn) {
            try {
                playFn();
            } catch (err) {
                // Silently fail — audio is non-critical
            }
        }
    }

    _playTone(freq, duration, type = 'sine', volume = 0.2) {
        const ctx = this.ctx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
    }

    _playSuccessChime() {
        const ctx = this.ctx;
        const now = ctx.currentTime;
        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6

        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.12);
            gain.gain.setValueAtTime(0.2, now + i * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.4);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + i * 0.12);
            osc.stop(now + i * 0.12 + 0.4);
        });
    }

    _playFailureBuzz() {
        const ctx = this.ctx;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.setValueAtTime(100, now + 0.1);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
    }

    _playUnlockSound() {
        const ctx = this.ctx;
        const now = ctx.currentTime;

        // Mechanical click
        this._playTone(2000, 0.03, 'square', 0.15);

        // Rising tone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now + 0.05);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.3);
        gain.gain.setValueAtTime(0.2, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + 0.05);
        osc.stop(now + 0.5);
    }

    _playSwoosh() {
        const ctx = this.ctx;
        const now = ctx.currentTime;
        const bufferSize = ctx.sampleRate * 0.2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }

        const source = ctx.createBufferSource();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        source.buffer = buffer;
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1000, now);
        filter.frequency.exponentialRampToValueAtTime(4000, now + 0.2);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        source.start(now);
    }

    _playBadgeSound() {
        const ctx = this.ctx;
        const now = ctx.currentTime;
        const notes = [784, 988, 1175, 1568]; // G5, B5, D6, G6

        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + i * 0.1);
            gain.gain.setValueAtTime(0.2, now + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.5);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.5);
        });
    }

    _playLockTurn() {
        const ctx = this.ctx;
        const now = ctx.currentTime;

        for (let i = 0; i < 3; i++) {
            this._playTone(1500 + i * 200, 0.04, 'square', 0.1);
        }

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, now + 0.15);
        osc.frequency.exponentialRampToValueAtTime(700, now + 0.4);
        gain.gain.setValueAtTime(0.15, now + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + 0.15);
        osc.stop(now + 0.5);
    }

    _playVaultOpen() {
        const ctx = this.ctx;
        const now = ctx.currentTime;

        // Deep rumble
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(60, now);
        osc1.frequency.exponentialRampToValueAtTime(30, now + 1.5);
        gain1.gain.setValueAtTime(0.15, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 1.5);

        // Rising triumph
        setTimeout(() => this._playSuccessChime(), 800);
    }
}
