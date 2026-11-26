// Tiny synthesized sound effects for the v0 board — no audio files needed.
// Everything is guarded: if the browser blocks audio, the game still plays
// silently. The AudioContext is created on the first user gesture (Play).

class SoundFX {
    enabled = true;
    private ctx: AudioContext | null = null;

    /** Call from a user gesture (Play / audio test). */
    unlock(): void {
        try {
            if (!this.ctx) {
                const AC =
                    window.AudioContext ??
                    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
                if (!AC) return;
                this.ctx = new AC();
            }
            if (this.ctx.state === 'suspended') void this.ctx.resume();
        } catch {
            // Audio unavailable — stay silent.
        }
    }

    private tone(freq: number, startInMs: number, durMs: number, type: OscillatorType, gain: number): void {
        if (!this.enabled || !this.ctx) return;
        try {
            const t0 = this.ctx.currentTime + startInMs / 1000;
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, t0);
            g.gain.setValueAtTime(0, t0);
            g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
            g.gain.exponentialRampToValueAtTime(0.0001, t0 + durMs / 1000);
            osc.connect(g);
            g.connect(this.ctx.destination);
            osc.start(t0);
            osc.stop(t0 + durMs / 1000 + 0.05);
        } catch {
            // Ignore audio errors mid-show.
        }
    }

    /** Reel tick. */
    tick(): void {
        this.tone(1250, 0, 35, 'square', 0.025);
    }

    /** A digit/number locks into place. */
    land(): void {
        this.tone(660, 0, 90, 'sine', 0.06);
    }

    /** Prize revealed. */
    chime(): void {
        this.tone(523, 0, 220, 'sine', 0.07);
        this.tone(659, 110, 220, 'sine', 0.07);
        this.tone(784, 220, 320, 'sine', 0.08);
    }

    /** Wheel spin start. */
    whoosh(): void {
        if (!this.enabled || !this.ctx) return;
        try {
            const t0 = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(180, t0);
            osc.frequency.exponentialRampToValueAtTime(720, t0 + 0.9);
            g.gain.setValueAtTime(0, t0);
            g.gain.linearRampToValueAtTime(0.05, t0 + 0.1);
            g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1);
            osc.connect(g);
            g.connect(this.ctx.destination);
            osc.start(t0);
            osc.stop(t0 + 1.05);
        } catch {
            // Ignore audio errors mid-show.
        }
    }
}

export const sound = new SoundFX();
