// Floating show controls — always visible, on every stage of the board.

import { Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';

interface FloatingControlsProps {
    playing: boolean;
    started: boolean;
    muted: boolean;
    onTogglePlay: () => void;
    onRestart: () => void;
    onToggleMute: () => void;
}

export function FloatingControls({
    playing,
    started,
    muted,
    onTogglePlay,
    onRestart,
    onToggleMute,
}: FloatingControlsProps) {
    return (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3">
            <button
                type="button"
                onClick={onToggleMute}
                title={muted ? 'Unmute' : 'Mute'}
                aria-label={muted ? 'Unmute' : 'Mute'}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur transition hover:bg-black/80"
            >
                {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
            <button
                type="button"
                onClick={onRestart}
                title="Restart the draw from the beginning"
                aria-label="Restart the draw"
                className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur transition hover:bg-black/80"
            >
                <RotateCcw className="h-5 w-5" />
            </button>
            <button
                type="button"
                onClick={onTogglePlay}
                title={started && playing ? 'Pause' : 'Play'}
                aria-label={started && playing ? 'Pause' : 'Play'}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-[0_0_30px_rgba(255,42,75,0.6)] transition hover:bg-red-400"
            >
                {started && playing ? (
                    <Pause className="h-6 w-6 fill-white" />
                ) : (
                    <Play className="ml-0.5 h-6 w-6 fill-white" />
                )}
            </button>
        </div>
    );
}
