// Prize wheels: 12 sectors x 30 deg, spun with real easing.
// Rotation is a pure function of the shared show clock, so pause freezes
// the wheel mid-spin and resume continues from the exact same angle.

import { useEffect, useRef, useState } from 'react';
import { clamp01, easeOutCubic } from '../timeline';
import type { ShowClock } from '../timeline';

interface WheelProps {
    values: readonly string[]; // 12 values, in wheel order (clockwise from top)
    targetIndex: number; // 0..11 — the sector that must land on the pointer
    spinStartMs: number; // offset inside the wheels stage
    spinDurationMs: number;
    clock: ShowClock;
    stageStartMs: number; // show-elapsed ms when the wheels stage began
    size?: number; // px
    label: string;
}

function finalRotation(targetIndex: number): number {
    // 4 full turns, then land the target sector on the pointer (top).
    // Sectors sit clockwise, so the wheel must stop at -30deg * target.
    return 4 * 360 + ((12 - targetIndex) % 12) * 30;
}

export function PrizeWheel({
    values,
    targetIndex,
    spinStartMs,
    spinDurationMs,
    clock,
    stageStartMs,
    size = 320,
    label,
}: WheelProps) {
    const wheelRef = useRef<HTMLDivElement>(null);
    const [landed, setLanded] = useState(false);
    const landedRef = useRef(false);

    useEffect(() => {
        landedRef.current = false;
        setLanded(false);
        let raf = 0;
        const loop = () => {
            const stageElapsed = clock.current - stageStartMs;
            const p = clamp01((stageElapsed - spinStartMs) / spinDurationMs);
            const rot = easeOutCubic(p) * finalRotation(targetIndex);
            if (wheelRef.current) {
                wheelRef.current.style.transform = `rotate(${rot}deg)`;
            }
            if (p >= 1 && !landedRef.current) {
                landedRef.current = true;
                setLanded(true);
            }
            raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(raf);
    }, [clock, stageStartMs, spinStartMs, spinDurationMs, targetIndex]);

    return (
        <div className="flex flex-col items-center gap-3">
            <div className="text-xs font-bold tracking-[0.3em] text-amber-200/70">{label}</div>
            <div className="relative" style={{ width: size, height: size }}>
                {/* Pointer — fixed at the top, outside the rotating wheel. */}
                <div className="absolute -top-1 left-1/2 z-20 -translate-x-1/2">
                    <div className="h-0 w-0 border-x-[14px] border-t-[22px] border-x-transparent border-t-red-500 drop-shadow-[0_0_12px_rgba(255,42,75,0.8)]" />
                </div>
                {/* Outer ring */}
                <div className="absolute inset-0 rounded-full border-4 border-amber-400/40 bg-[#101216] shadow-[0_0_60px_rgba(245,197,66,0.15),inset_0_0_40px_rgba(0,0,0,0.8)]" />
                {/* Rotating wheel */}
                <div ref={wheelRef} className="absolute inset-[10px] rounded-full will-change-transform">
                    {values.map((value, i) => (
                        <div
                            key={i}
                            className="absolute inset-0"
                            style={{ transform: `rotate(${i * 30}deg)` }}
                        >
                            <div
                                className={`absolute left-1/2 top-[6px] -translate-x-1/2 rounded-md px-2 py-1 text-center font-black leading-none ${
                                    landed && i === targetIndex
                                        ? 'bg-amber-400 text-black shadow-[0_0_18px_rgba(245,197,66,0.9)]'
                                        : i % 2 === 0
                                          ? 'text-amber-100'
                                          : 'text-amber-100/50'
                                }`}
                                style={{ fontSize: size * 0.075 }}
                            >
                                {value}
                            </div>
                        </div>
                    ))}
                </div>
                {/* Hub — shows the landed value. */}
                <div className="absolute left-1/2 top-1/2 z-10 flex h-[92px] w-[92px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-amber-400/50 bg-[#08090b] shadow-[0_0_30px_rgba(0,0,0,0.9)]">
                    <span
                        className={`font-black ${landed ? 'text-amber-300' : 'text-white/25'}`}
                        style={{ fontSize: size * 0.11 }}
                    >
                        {landed ? values[targetIndex] : '·'}
                    </span>
                </div>
            </div>
        </div>
    );
}
