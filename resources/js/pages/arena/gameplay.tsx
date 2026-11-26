// v0 arena board — the whole game, dummy data, no DB, no broadcast.
// The show is driven by one clock (a mutable ref). A single rAF loop
// advances it while playing; every wheel and reel reads the same clock,
// so pause freezes the entire show exactly and restart resets it to zero.

import { useEffect, useRef, useState } from 'react';
import { Head } from '@inertiajs/react';
import { DUMMY_DRAW, DRAW_TIMES, SERIES_LETTERS, SERIES_NUMBERS, fifthSets } from './dummy-draw';
import {
    COUNTDOWN_SECONDS,
    FIFTH_SET,
    FIRST_REEL,
    GRID_REEL,
    LETTER_WHEEL,
    NUMBER_WHEEL,
    TIMELINE,
    TOTAL_DURATION_MS,
    stateAt,
} from './timeline';
import type { ShowClock } from './timeline';
import { PrizeWheel } from './components/wheels';
import { ReelsGrid, ReelsRow, StaticDigits, StaticGrid } from './components/reels';
import { BoardHeader, CountdownScreen, EndScreen, WelcomeScreen } from './components/screens';
import { FloatingControls } from './components/controls';
import { sound } from './sound';

function StageTitle({ title, subtitle }: { title: string; subtitle: string }) {
    return (
        <div className="text-center">
            <div className="text-2xl font-black tracking-[0.2em] text-amber-300 sm:text-4xl">{title}</div>
            {subtitle && <div className="mt-2 text-sm font-bold tracking-[0.3em] text-white/60">{subtitle}</div>}
        </div>
    );
}

export default function Gameplay() {
    const draw = DUMMY_DRAW;
    const sets = fifthSets(draw);
    const numberTarget = SERIES_NUMBERS.indexOf(draw.series_number);
    const letterTarget = SERIES_LETTERS.indexOf(draw.series_letter);

    const clockRef = useRef<ShowClock>({ current: 0 });
    const lastTsRef = useRef<number | null>(null);
    const lastTickRef = useRef(0);

    const [started, setStarted] = useState(false);
    const [playing, setPlaying] = useState(false);
    const [finished, setFinished] = useState(false);
    const [muted, setMuted] = useState(false);
    const [audioTested, setAudioTested] = useState(false);
    const [stageIndex, setStageIndex] = useState(0);
    const [stageStartMs, setStageStartMs] = useState(0);
    const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
    const [stageElapsedBucket, setStageElapsedBucket] = useState(0);

    const startedRef = useRef(false);
    const playingRef = useRef(false);
    const finishedRef = useRef(false);
    const stageIndexRef = useRef(0);
    const secondsRef = useRef(COUNTDOWN_SECONDS);
    const stageElapsedBucketRef = useRef(0);

    // Master loop: advance the clock, sync React state only when something
    // visible changes (stage, countdown second, fifth-set intro).
    useEffect(() => {
        let raf = 0;
        const loop = (ts: number) => {
            if (lastTsRef.current === null) lastTsRef.current = ts;
            const dt = Math.min(100, ts - lastTsRef.current);
            lastTsRef.current = ts;

            if (playingRef.current && startedRef.current && !finishedRef.current) {
                clockRef.current.current = Math.min(TOTAL_DURATION_MS, clockRef.current.current + dt);
                const st = stateAt(clockRef.current.current);

                if (st.stageIndex !== stageIndexRef.current) {
                    stageIndexRef.current = st.stageIndex;
                    setStageIndex(st.stageIndex);
                    setStageStartMs(st.stageStartMs);
                    stageElapsedBucketRef.current = 0;
                    setStageElapsedBucket(0);
                    if (st.stage.id === 'wheels') sound.whoosh();
                    if (st.stage.id.endsWith('-hold') || st.stage.id === 'end') sound.chime();
                }

                if (st.stage.id === 'countdown' || st.stage.id.startsWith('gap-')) {
                    const sec = Math.ceil((st.stage.durationMs - st.stageElapsedMs) / 1000);
                    if (sec !== secondsRef.current) {
                        secondsRef.current = sec;
                        setSecondsLeft(sec);
                    }
                }

                if (st.stage.id.startsWith('fifth-set-')) {
                    const bucket = Math.floor(st.stageElapsedMs / 100) * 100;
                    if (bucket !== stageElapsedBucketRef.current) {
                        stageElapsedBucketRef.current = bucket;
                        setStageElapsedBucket(bucket);
                    }
                }

                if (st.stage.id.endsWith('-reels') && ts - lastTickRef.current > 150) {
                    lastTickRef.current = ts;
                    sound.tick();
                }

                if (st.finished && !finishedRef.current) {
                    finishedRef.current = true;
                    setFinished(true);
                    playingRef.current = false;
                    setPlaying(false);
                }
            }
            raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(raf);
    }, []);

    const startShow = () => {
        sound.unlock();
        clockRef.current.current = 0;
        lastTsRef.current = null;
        stageIndexRef.current = 0;
        setStageIndex(0);
        setStageStartMs(0);
        setSecondsLeft(COUNTDOWN_SECONDS);
        stageElapsedBucketRef.current = 0;
        setStageElapsedBucket(0);
        finishedRef.current = false;
        setFinished(false);
        startedRef.current = true;
        setStarted(true);
        playingRef.current = true;
        setPlaying(true);
    };

    const togglePlay = () => {
        sound.unlock();
        if (!startedRef.current || finishedRef.current) {
            startShow();
            return;
        }
        const next = !playingRef.current;
        playingRef.current = next;
        setPlaying(next);
    };

    const restart = () => {
        startShow();
    };

    const toggleMute = () => {
        setMuted((m) => {
            sound.enabled = m;
            return !m;
        });
    };

    const testAudio = () => {
        sound.unlock();
        sound.chime();
        setAudioTested(true);
    };

    const stage = TIMELINE[stageIndex];
    const clock = clockRef.current;

    const renderStage = () => {
        if (!started || finished) {
            return (
                <WelcomeScreen
                    draw={draw}
                    drawTimes={DRAW_TIMES}
                    audioTested={audioTested}
                    onTestAudio={testAudio}
                    onPlay={togglePlay}
                    completed={finished}
                />
            );
        }

        switch (stage.id) {
            case 'countdown':
                return (
                    <CountdownScreen title="1st Prize" subtitle="ON 5 DIGITS WITH SERIES" secondsLeft={secondsLeft} />
                );
            case 'wheels':
                return (
                    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4">
                        <StageTitle title="1st Prize" subtitle="SERIES DRAW" />
                        <div className="flex flex-wrap items-start justify-center gap-10">
                            <PrizeWheel
                                values={SERIES_NUMBERS}
                                targetIndex={numberTarget}
                                spinStartMs={NUMBER_WHEEL.startMs}
                                spinDurationMs={NUMBER_WHEEL.durationMs}
                                clock={clock}
                                stageStartMs={stageStartMs}
                                label="NUMBER"
                            />
                            <PrizeWheel
                                values={SERIES_LETTERS}
                                targetIndex={letterTarget}
                                spinStartMs={LETTER_WHEEL.startMs}
                                spinDurationMs={LETTER_WHEEL.durationMs}
                                clock={clock}
                                stageStartMs={stageStartMs}
                                label="LETTER"
                            />
                        </div>
                    </div>
                );
            case 'first-reels':
                return (
                    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4">
                        <StageTitle title="1st Prize" subtitle="ON 5 DIGITS WITH SERIES" />
                        <ReelsRow
                            number={draw.first}
                            digitH={96}
                            clock={clock}
                            stageStartMs={stageStartMs}
                            baseStartMs={0}
                            digitStaggerMs={FIRST_REEL.digitStaggerMs}
                            spinDurationMs={FIRST_REEL.spinMs}
                        />
                        <div className="text-sm font-bold tracking-[0.3em] text-white/40">
                            SERIES {draw.series_number}
                            {draw.series_letter}
                        </div>
                    </div>
                );
            case 'first-hold':
                return (
                    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4">
                        <div className="text-2xl font-black tracking-[0.2em] text-amber-300 sm:text-4xl">
                            1st PRIZE WINNER
                        </div>
                        <div className="scale-105">
                            <StaticDigits number={draw.first} digitH={110} />
                        </div>
                        <div className="text-xl font-black tracking-[0.3em] text-white">
                            SERIES {draw.series_number}
                            {draw.series_letter} · {draw.first}
                        </div>
                    </div>
                );
            case 'gap-2':
            case 'gap-3':
            case 'gap-4':
            case 'gap-5':
                return <CountdownScreen title={stage.title} subtitle={stage.subtitle} secondsLeft={secondsLeft} />;
            case 'second-reels':
            case 'third-reels':
            case 'fourth-reels': {
                const numbers =
                    stage.id === 'second-reels'
                        ? draw.second_winners
                        : stage.id === 'third-reels'
                          ? draw.third_winners
                          : draw.fourth_winners;
                return (
                    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-4">
                        <StageTitle title={stage.title} subtitle={stage.subtitle} />
                        <ReelsGrid
                            numbers={numbers}
                            digitH={48}
                            clock={clock}
                            stageStartMs={stageStartMs}
                            rowStaggerMs={GRID_REEL.rowStaggerMs}
                            digitStaggerMs={GRID_REEL.digitStaggerMs}
                            spinDurationMs={GRID_REEL.spinMs}
                        />
                    </div>
                );
            }
            case 'second-hold':
            case 'third-hold':
            case 'fourth-hold': {
                const numbers =
                    stage.id === 'second-hold'
                        ? draw.second_winners
                        : stage.id === 'third-hold'
                          ? draw.third_winners
                          : draw.fourth_winners;
                return (
                    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-4">
                        <StageTitle title={stage.title} subtitle="10 WINNERS" />
                        <StaticGrid numbers={numbers} digitH={48} />
                    </div>
                );
            }
            case 'fifth-set-1':
            case 'fifth-set-2':
            case 'fifth-set-3':
            case 'fifth-set-4':
            case 'fifth-set-5': {
                const setIndex = Number(stage.id.split('-')[2]) - 1;
                const setNumbers = sets[setIndex];
                const inIntro = stageElapsedBucket < FIFTH_SET.introMs;
                return (
                    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-4">
                        <StageTitle title="5th Prize" subtitle={`SET ${setIndex + 1} OF 5 — ON 4 DIGITS WITH 100 TIMES`} />
                        {inIntro ? (
                            <div className="flex animate-pulse items-center justify-center py-16 text-4xl font-black tracking-[0.3em] text-amber-300">
                                SET {setIndex + 1}
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 gap-3">
                                {setNumbers.map((n, i) => (
                                    <ReelsRow
                                        key={i}
                                        number={n}
                                        digitH={40}
                                        clock={clock}
                                        stageStartMs={stageStartMs}
                                        baseStartMs={FIFTH_SET.introMs + i * FIFTH_SET.rowStaggerMs}
                                        digitStaggerMs={FIFTH_SET.digitStaggerMs}
                                        spinDurationMs={FIFTH_SET.spinMs}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                );
            }
            case 'end':
                return <EndScreen draw={draw} onPlayAgain={togglePlay} />;
            default:
                return null;
        }
    };

    return (
        <>
            <Head title="Arena Gameplay" />
            <div className="flex min-h-screen w-full flex-col items-center bg-[#08090b] text-white">
                {started && !finished && <BoardHeader draw={draw} currentPrize={stage.prize} />}
                {renderStage()}
                <FloatingControls
                    playing={playing}
                    started={started}
                    muted={muted}
                    onTogglePlay={togglePlay}
                    onRestart={restart}
                    onToggleMute={toggleMute}
                />
            </div>
        </>
    );
}
