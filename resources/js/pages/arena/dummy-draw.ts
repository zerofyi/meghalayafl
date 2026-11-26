// Complete dummy dataset for the v0 arena board.
// No DB, no broadcast in v0 — the board plays this payload.
// Deterministic: same numbers on every load (seeded generator), unique
// across all tiers within the draw, matching the gameboard data contract.

export interface DrawPayload {
    id: number;
    date: string;
    slot: string;
    status: 'live';
    series_number: SeriesNumber;
    series_letter: SeriesLetter;
    first: string;
    second_winners: string[];
    third_winners: string[];
    fourth_winners: string[];
    fifth_winners: string[];
}

export const DRAW_TIMES = ['01:55 PM', '06:55 PM', '08:55 PM'] as const;

// Wheel order from the old board (index-based spin math: sector x 30 deg).
export const SERIES_NUMBERS = ['12', '78', '33', '17', '92', '73', '66', '54', '29', '31', '42', '86'] as const;
export const SERIES_LETTERS = ['X', 'R', 'N', 'M', 'L', 'K', 'F', 'E', 'D', 'C', 'B', 'A'] as const;

export type SeriesNumber = (typeof SERIES_NUMBERS)[number];
export type SeriesLetter = (typeof SERIES_LETTERS)[number];

function mulberry32(seed: number): () => number {
    let a = seed;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function uniqueNumbers(
    rng: () => number,
    count: number,
    min: number,
    max: number,
    used: Set<string>,
    digits: number,
): string[] {
    const out: string[] = [];
    while (out.length < count) {
        const n = min + Math.floor(rng() * (max - min + 1));
        const s = String(n).padStart(digits, '0');
        if (used.has(s)) continue;
        used.add(s);
        out.push(s);
    }
    return out;
}

function buildDummyDraw(): DrawPayload {
    const rng = mulberry32(20261127);
    // 1st prize is typed by hand in the real game; fixed here to match the
    // data contract's fake payload.
    const first = '48291';
    const used = new Set<string>([first]);
    const second = uniqueNumbers(rng, 10, 10000, 99999, used, 5);
    const third = uniqueNumbers(rng, 10, 1000, 9999, used, 4);
    const fourth = uniqueNumbers(rng, 10, 1000, 9999, used, 4);
    const fifth = uniqueNumbers(rng, 100, 1000, 9999, used, 4);

    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
        now.getDate(),
    ).padStart(2, '0')}`;

    return {
        id: 1,
        date,
        slot: '08:55 PM',
        status: 'live',
        series_number: '86',
        series_letter: 'A',
        first,
        second_winners: second,
        third_winners: third,
        fourth_winners: fourth,
        fifth_winners: fifth,
    };
}

export const DUMMY_DRAW: DrawPayload = buildDummyDraw();

/** 5th prize in 5 sets of 20, as the board reveals them. */
export function fifthSets(draw: DrawPayload): string[][] {
    const sets: string[][] = [];
    for (let i = 0; i < 5; i++) {
        sets.push(draw.fifth_winners.slice(i * 20, (i + 1) * 20));
    }
    return sets;
}
