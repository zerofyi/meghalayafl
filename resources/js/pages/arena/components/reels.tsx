// Slot reels: each digit is a vertical strip of 0-9 (x3) that scrolls with
// real easing and lands on the target digit. Position is a pure function
// of the shared show clock, so pause freezes the reels mid-scroll.

import { useEffect, useRef, useState } from 'react';
import { clamp01, easeOutQuint } from '../timeline';
import type { ShowClock } from '../timeline';

interface DigitReelProps {
    target: number; // 0-9
    spinStartMs: number; // offset inside the stage
    spinDurationMs: number;
    digitH: number;
    clock: ShowClock;
    stageStartMs: number; // show-elapsed ms when this stage began
}

const STRIP = Array.from({ length: 30 }, (_, i) => i % 10);

export function DigitReel({ target, spinStartMs, spinDurationMs, digitH, clock, stageStartMs }: DigitReelProps) {
    const stripRef = useRef<HTMLDivElement>(null);
    const [locked, setLocked] = useState(false);
    const lockedRef = useRef(false);

    useEffect(() => {
        lockedRef.current = false;
        setLocked(false);
        let raf = 0;
        const loop = () => {
            const stageElapsed = clock.current - stageStartMs;
            const p = clamp01((stageElapsed - spinStartMs) / spinDurationMs);
            // Travel: 2 full digit cycles + the target digit of the 3rd copy.
            const y = -easeOutQuint(p) * (20 + target) * digitH;
            if (stripRef.current) {
                stripRef.current.style.transform = `translateY(${y}px)`;
            }
            if (p >= 1 && !lockedRef.current) {
                lockedRef.current = true;
                setLocked(true);
            }
            raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(raf);
    }, [clock, stageStartMs, spinStartMs, spinDurationMs, target, digitH]);

    return (
        <div
            className={`relative overflow-hidden rounded-lg border bg-[#101216] transition-shadow ${
                locked ? 'border-amber-400 shadow-[0_0_18px_rgba(245,197,66,0.45)]' : 'border-white/15'
            }`}
            style={{ width: digitH * 0.72, height: digitH }}
        >
            <div ref={stripRef} className="flex flex-col will-change-transform">
                {STRIP.map((d, i) => (
                    <div
                        key={i}
                        className="flex items-center justify-center font-black text-white"
                        style={{ height: digitH, fontSize: digitH * 0.72 }}
                    >
                        {d}
                    </div>
                ))}
            </div>
            {/* Top/bottom fade for the spin. */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[18%] bg-gradient-to-b from-[#101216] to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[18%] bg-gradient-to-t from-[#101216] to-transparent" />
        </div>
    );
}

interface ReelsRowProps {
    number: string;
    digitH: number;
    clock: ShowClock;
    stageStartMs: number;
    baseStartMs: number;
    digitStaggerMs: number;
    spinDurationMs: number;
}

export function ReelsRow({
    number,
    digitH,
    clock,
    stageStartMs,
    baseStartMs,
    digitStaggerMs,
    spinDurationMs,
}: ReelsRowProps) {
    return (
        <div className="flex gap-2">
            {number.split('').map((ch, j) => (
                <DigitReel
                    key={j}
                    target={Number(ch)}
                    spinStartMs={baseStartMs + j * digitStaggerMs}
                    spinDurationMs={spinDurationMs}
                    digitH={digitH}
                    clock={clock}
                    stageStartMs={stageStartMs}
                />
            ))}
        </div>
    );
}

interface ReelsGridProps {
    numbers: string[];
    digitH: number;
    clock: ShowClock;
    stageStartMs: number;
    rowStaggerMs: number;
    digitStaggerMs: number;
    spinDurationMs: number;
}

/** 10-number grid (2nd/3rd/4th prize): one row per winner. */
export function ReelsGrid({
    numbers,
    digitH,
    clock,
    stageStartMs,
    rowStaggerMs,
    digitStaggerMs,
    spinDurationMs,
}: ReelsGridProps) {
    return (
        <div className="flex flex-col items-center gap-2">
            {numbers.map((n, i) => (
                <ReelsRow
                    key={i}
                    number={n}
                    digitH={digitH}
                    clock={clock}
                    stageStartMs={stageStartMs}
                    baseStartMs={i * rowStaggerMs}
                    digitStaggerMs={digitStaggerMs}
                    spinDurationMs={spinDurationMs}
                />
            ))}
        </div>
    );
}

/** Static (already landed) digits — used on hold stages so numbers never re-spin. */
export function StaticDigits({ number, digitH }: { number: string; digitH: number }) {
    return (
        <div className="flex gap-2">
            {number.split('').map((ch, j) => (
                <div
                    key={j}
                    className="flex items-center justify-center rounded-lg border border-amber-400/70 bg-[#101216] font-black text-amber-300 shadow-[0_0_18px_rgba(245,197,66,0.35)]"
                    style={{ width: digitH * 0.72, height: digitH, fontSize: digitH * 0.72 }}
                >
                    {ch}
                </div>
            ))}
        </div>
    );
}

export function StaticGrid({ numbers, digitH }: { numbers: string[]; digitH: number }) {
    return (
        <div className="flex flex-col items-center gap-2">
            {numbers.map((n, i) => (
                <StaticDigits key={i} number={n} digitH={digitH} />
            ))}
        </div>
    );
}
