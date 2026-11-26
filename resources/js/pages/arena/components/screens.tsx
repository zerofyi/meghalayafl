// Static screens of the board: welcome (with audio check), countdown,
// end screen, and the stage header shown through the whole show.

import { Check, Play, Trophy, Volume2 } from 'lucide-react';
import { formatClock } from '../timeline';
import type { DrawPayload } from '../dummy-draw';

export function BoardHeader({ draw, currentPrize }: { draw: DrawPayload; currentPrize: number }) {
    return (
        <header className="flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 pt-5">
            <div className="flex items-center gap-3">
                <span className="flex items-center gap-2 rounded-full border border-red-500/50 bg-red-500/15 px-3 py-1 text-xs font-black tracking-[0.25em] text-red-400">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                    LIVE
                </span>
                <span className="text-sm font-bold tracking-[0.2em] text-white/80">
                    MEGHALAYA FUTURE LOTTERY
                </span>
            </div>
            <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-white/60">
                    {draw.date} · {draw.slot}
                </span>
                <span className="flex items-center gap-1.5" aria-label={`Prize ${currentPrize} of 5`}>
                    {[1, 2, 3, 4, 5].map((n) => (
                        <span
                            key={n}
                            className={`h-2.5 w-2.5 rounded-full ${
                                n < currentPrize
                                    ? 'bg-amber-400'
                                    : n === currentPrize
                                      ? 'animate-pulse bg-red-500 ring-2 ring-red-500/40'
                                      : 'bg-white/20'
                            }`}
                        />
                    ))}
                </span>
            </div>
        </header>
    );
}

interface WelcomeProps {
    draw: DrawPayload;
    drawTimes: readonly string[];
    audioTested: boolean;
    onTestAudio: () => void;
    onPlay: () => void;
    completed: boolean;
}

export function WelcomeScreen({ draw, drawTimes, audioTested, onTestAudio, onPlay, completed }: WelcomeProps) {
    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 text-center">
            <div>
                <div className="text-xs font-black tracking-[0.5em] text-red-500">WELCOME TO</div>
                <h1 className="mt-3 text-5xl font-black tracking-tight text-white sm:text-7xl">
                    MEGHALAYA
                    <span className="block bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200 bg-clip-text text-transparent">
                        FUTURE LOTTERY
                    </span>
                </h1>
                <p className="mt-4 text-sm font-semibold tracking-[0.3em] text-white/60">
                    DRAW TIME {drawTimes.join(' · ')}
                </p>
            </div>

            {completed && (
                <div className="rounded-full border border-amber-400/60 bg-amber-400/10 px-5 py-2 text-sm font-black tracking-[0.25em] text-amber-300">
                    LIVE DRAW COMPLETED
                </div>
            )}

            <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-8 py-5">
                <div className="text-xs font-bold tracking-[0.25em] text-white/50">AUDIO CHECK</div>
                <button
                    type="button"
                    onClick={onTestAudio}
                    className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/20"
                >
                    <Volume2 className="h-4 w-4" />
                    {audioTested ? 'Test audio again' : 'Play test audio'}
                    {audioTested && <Check className="h-4 w-4 text-emerald-400" />}
                </button>
                <div className="text-xs text-white/40">
                    {audioTested
                        ? 'Audio is working — the show can start.'
                        : 'Play the test sound once, so the recording has audio.'}
                </div>
            </div>

            <button
                type="button"
                onClick={onPlay}
                className="group flex items-center gap-3 rounded-full bg-red-500 px-10 py-4 text-lg font-black tracking-wider text-white shadow-[0_0_40px_rgba(255,42,75,0.5)] transition hover:bg-red-400"
            >
                <Play className="h-6 w-6 fill-white" />
                {completed ? 'PLAY AGAIN' : 'START THE DRAW'}
            </button>

            <div className="text-xs text-white/30">
                {draw.date} · {draw.slot} · v0 — dummy draw, no broadcast
            </div>
        </div>
    );
}

interface CountdownProps {
    title: string;
    subtitle: string;
    secondsLeft: number;
}

export function CountdownScreen({ title, subtitle, secondsLeft }: CountdownProps) {
    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
            <div className="text-2xl font-black tracking-[0.2em] text-amber-300 sm:text-4xl">{title}</div>
            <div className="text-sm font-bold tracking-[0.3em] text-white/60">{subtitle}</div>
            <div className="font-black tabular-nums text-white drop-shadow-[0_0_30px_rgba(245,197,66,0.35)] text-8xl sm:text-9xl">
                {formatClock(secondsLeft)}
            </div>
            <div className="text-xs tracking-[0.3em] text-white/30">DRAW STARTING SOON</div>
        </div>
    );
}

export function EndScreen({ draw, onPlayAgain }: { draw: DrawPayload; onPlayAgain: () => void }) {
    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 text-center">
            <Trophy className="h-16 w-16 text-amber-300" />
            <div>
                <h2 className="text-4xl font-black tracking-tight text-white sm:text-6xl">LIVE DRAW COMPLETED</h2>
                <p className="mt-4 text-sm font-bold tracking-[0.25em] text-white/60">
                    RESULTS AVAILABLE AT www.meghalayafuturelottery.com
                </p>
                <p className="mt-2 text-xs text-white/40">
                    {draw.date} · {draw.slot} · Series {draw.series_number}
                    {draw.series_letter} · 1st Prize {draw.first}
                </p>
            </div>
            <button
                type="button"
                onClick={onPlayAgain}
                className="flex items-center gap-3 rounded-full bg-red-500 px-8 py-3.5 text-base font-black tracking-wider text-white shadow-[0_0_40px_rgba(255,42,75,0.5)] transition hover:bg-red-400"
            >
                <Play className="h-5 w-5 fill-white" />
                PLAY AGAIN
            </button>
        </div>
    );
}
