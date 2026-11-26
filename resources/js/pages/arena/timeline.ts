// Show timeline for the v0 arena board.
// The whole show is a fixed linear sequence of stages. Everything visual
// (wheels, reels, countdown) is a pure function of show-elapsed time, so
// pausing the clock freezes the entire show exactly, and restart just
// resets the clock to zero.

/** Mutable clock shared by the page and every animated component. */
export interface ShowClock {
    current: number; // show-elapsed milliseconds
}

export type StageId =
    | 'countdown'
    | 'wheels'
    | 'first-reels'
    | 'first-hold'
    | 'gap-2'
    | 'second-reels'
    | 'second-hold'
    | 'gap-3'
    | 'third-reels'
    | 'third-hold'
    | 'gap-4'
    | 'fourth-reels'
    | 'fourth-hold'
    | 'gap-5'
    | 'fifth-set-1'
    | 'fifth-set-2'
    | 'fifth-set-3'
    | 'fifth-set-4'
    | 'fifth-set-5'
    | 'end';

export interface StageDef {
    id: StageId;
    durationMs: number;
    /** Prize this stage belongs to (1-5), for the progress dots. */
    prize: number;
    title: string;
    subtitle: string;
}

export const COUNTDOWN_SECONDS = 59;
export const GAP_SECONDS = 10;
export const HOLD_SECONDS = 10;
export const FIFTH_SET_SIZE = 20;
export const FIFTH_SET_COUNT = 5;

/** Wheels stage: number wheel spins first, then the letter wheel. */
export const NUMBER_WHEEL = { startMs: 0, durationMs: 4000 };
export const LETTER_WHEEL = { startMs: 4500, durationMs: 4000 };

/** 1st-prize reels: 5 digits, staggered. */
export const FIRST_REEL = { digitStaggerMs: 300, spinMs: 2600 };
/** 2nd/3rd/4th grids: 10 numbers, staggered per row then per digit. */
export const GRID_REEL = { rowStaggerMs: 200, digitStaggerMs: 100, spinMs: 2800 };
/** 5th-prize set: 3s intro, reels, then hold to the end of the set. */
export const FIFTH_SET = { introMs: 3000, rowStaggerMs: 120, digitStaggerMs: 80, spinMs: 2200 };

function fifthSetStage(n: number): StageDef {
    return {
        id: `fifth-set-${n}` as StageId,
        durationMs: 18000,
        prize: 5,
        title: '5th Prize',
        subtitle: `SET ${n} OF 5 — ON 4 DIGITS WITH 100 TIMES`,
    };
}

export const TIMELINE: StageDef[] = [
    { id: 'countdown', durationMs: 59000, prize: 1, title: '1st Prize', subtitle: 'ON 5 DIGITS WITH SERIES' },
    { id: 'wheels', durationMs: 9000, prize: 1, title: '1st Prize', subtitle: 'SERIES DRAW' },
    { id: 'first-reels', durationMs: 5000, prize: 1, title: '1st Prize', subtitle: 'ON 5 DIGITS WITH SERIES' },
    { id: 'first-hold', durationMs: 10000, prize: 1, title: '1st Prize Winner', subtitle: '' },
    { id: 'gap-2', durationMs: 10000, prize: 2, title: '2nd Prize', subtitle: 'ON 5 DIGITS WITH 10 TIMES' },
    { id: 'second-reels', durationMs: 6000, prize: 2, title: '2nd Prize', subtitle: 'ON 5 DIGITS WITH 10 TIMES' },
    { id: 'second-hold', durationMs: 10000, prize: 2, title: '2nd Prize', subtitle: '10 WINNERS' },
    { id: 'gap-3', durationMs: 10000, prize: 3, title: '3rd Prize', subtitle: 'ON 4 DIGITS WITH 10 TIMES' },
    { id: 'third-reels', durationMs: 6000, prize: 3, title: '3rd Prize', subtitle: 'ON 4 DIGITS WITH 10 TIMES' },
    { id: 'third-hold', durationMs: 10000, prize: 3, title: '3rd Prize', subtitle: '10 WINNERS' },
    { id: 'gap-4', durationMs: 10000, prize: 4, title: '4th Prize', subtitle: 'ON 4 DIGITS WITH 10 TIMES' },
    { id: 'fourth-reels', durationMs: 6000, prize: 4, title: '4th Prize', subtitle: 'ON 4 DIGITS WITH 10 TIMES' },
    { id: 'fourth-hold', durationMs: 10000, prize: 4, title: '4th Prize', subtitle: '10 WINNERS' },
    { id: 'gap-5', durationMs: 10000, prize: 5, title: '5th Prize', subtitle: 'ON 4 DIGITS WITH 100 TIMES' },
    fifthSetStage(1),
    fifthSetStage(2),
    fifthSetStage(3),
    fifthSetStage(4),
    fifthSetStage(5),
    {
        id: 'end',
        durationMs: 5000,
        prize: 5,
        title: 'Draw Complete',
        subtitle: 'RESULTS AVAILABLE AT www.meghalayafuturelottery.com',
    },
];

export const TOTAL_DURATION_MS = TIMELINE.reduce((sum, stage) => sum + stage.durationMs, 0);

export interface ShowState {
    stageIndex: number;
    stage: StageDef;
    /** Show-elapsed ms at which this stage began. */
    stageStartMs: number;
    /** Ms elapsed inside the current stage. */
    stageElapsedMs: number;
    /** 0..1 progress inside the current stage. */
    stageProgress: number;
    totalElapsedMs: number;
    finished: boolean;
}

export function stateAt(elapsedMs: number): ShowState {
    const total = Math.min(elapsedMs, TOTAL_DURATION_MS);
    let acc = 0;
    for (let i = 0; i < TIMELINE.length; i++) {
        const stage = TIMELINE[i];
        if (total < acc + stage.durationMs || i === TIMELINE.length - 1) {
            const stageElapsedMs = Math.max(0, total - acc);
            return {
                stageIndex: i,
                stage,
                stageStartMs: acc,
                stageElapsedMs,
                stageProgress: Math.min(1, stageElapsedMs / stage.durationMs),
                totalElapsedMs: total,
                finished: total >= TOTAL_DURATION_MS,
            };
        }
        acc += stage.durationMs;
    }
    // Unreachable, but keeps TS happy.
    const last = TIMELINE[TIMELINE.length - 1];
    return {
        stageIndex: TIMELINE.length - 1,
        stage: last,
        stageStartMs: TOTAL_DURATION_MS - last.durationMs,
        stageElapsedMs: last.durationMs,
        stageProgress: 1,
        totalElapsedMs: TOTAL_DURATION_MS,
        finished: true,
    };
}

export function clamp01(p: number): number {
    return Math.min(1, Math.max(0, p));
}

export function easeOutCubic(p: number): number {
    return 1 - Math.pow(1 - p, 3);
}

export function easeOutQuint(p: number): number {
    return 1 - Math.pow(1 - p, 5);
}

export function formatClock(totalSeconds: number): string {
    const s = Math.max(0, Math.ceil(totalSeconds));
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}
