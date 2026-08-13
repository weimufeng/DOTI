import type {
  DimKey,
  Hero,
  MatchResult,
  OptionKey,
  Question,
  QuestionOption,
  ScoreResult,
} from "./types";

export const DIMS: DimKey[] = [
  "Aggression",
  "Power",
  "Leadership",
  "Knowledge",
  "Freedom",
  "Honor",
  "Protection",
  "Chaos",
  "Social",
  "Ambition",
];

export const DIM_LABELS: Record<DimKey, string> = {
  Aggression: "锋芒",
  Power: "掌控",
  Leadership: "领导",
  Knowledge: "洞见",
  Freedom: "自由",
  Honor: "荣誉",
  Protection: "守护",
  Chaos: "混沌",
  Social: "社交",
  Ambition: "野心",
};

export const VALID_WINGS: Record<number, readonly [number, number]> = {
  1: [9, 2],
  2: [1, 3],
  3: [2, 4],
  4: [3, 5],
  5: [4, 6],
  6: [5, 7],
  7: [6, 8],
  8: [7, 9],
  9: [8, 1],
};

const MBTI_PAIRS = [
  ["E", "I"],
  ["S", "N"],
  ["T", "F"],
  ["J", "P"],
] as const;

function emptyDims(): Record<DimKey, number> {
  return Object.fromEntries(DIMS.map((d) => [d, 0])) as Record<DimKey, number>;
}

export function resolveOptions(
  questions: Question[],
  answers: OptionKey[],
): QuestionOption[] {
  if (answers.length !== questions.length) {
    throw new Error(`Expected ${questions.length} answers, got ${answers.length}`);
  }
  return questions.map((q, i) => {
    const opt = q.options.find((o) => o.key === answers[i]);
    if (!opt) throw new Error(`Invalid answer ${answers[i]} for Q${q.id}`);
    return opt;
  });
}

export function computeDimBounds(
  questions: Question[],
): Record<DimKey, { min: number; max: number }> {
  const bounds = {} as Record<DimKey, { min: number; max: number }>;
  for (const d of DIMS) {
    let poss = new Set<number>([0]);
    for (const q of questions) {
      const next = new Set<number>();
      for (const s of poss) {
        for (const o of q.options) next.add(s + (o.dims[d] ?? 0));
      }
      poss = next;
    }
    bounds[d] = { min: Math.min(...poss), max: Math.max(...poss) };
  }
  return bounds;
}

let cachedBounds: Record<DimKey, { min: number; max: number }> | null = null;
let cachedBoundsKey = "";

function boundsFor(questions: Question[]) {
  const key = String(questions.length);
  if (!cachedBounds || cachedBoundsKey !== key) {
    cachedBounds = computeDimBounds(questions);
    cachedBoundsKey = key;
  }
  return cachedBounds;
}

export function scoreAnswers(
  questions: Question[],
  answers: OptionKey[],
): ScoreResult {
  const choices = resolveOptions(questions, answers);
  const mbtiVotes: Record<string, number> = {};
  const coreVotes: Record<number, number> = {};
  const wingByCore: Record<number, Record<number, number>> = {};
  const rawDims = emptyDims();

  for (const o of choices) {
    for (const [k, v] of Object.entries(o.mbti)) {
      mbtiVotes[k] = (mbtiVotes[k] ?? 0) + (v ?? 0);
    }
    const c = o.enneagram.core;
    const w = o.enneagram.wing;
    coreVotes[c] = (coreVotes[c] ?? 0) + 1;
    if (!wingByCore[c]) wingByCore[c] = {};
    wingByCore[c][w] = (wingByCore[c][w] ?? 0) + 1;
    for (const d of DIMS) rawDims[d] += o.dims[d] ?? 0;
  }

  const mbti = MBTI_PAIRS.map(([a, b]) => {
    const sa = mbtiVotes[a] ?? 0;
    const sb = mbtiVotes[b] ?? 0;
    if (sa > sb) return a;
    if (sb > sa) return b;
    return a;
  }).join("");

  let core = 1;
  for (let c = 1; c <= 9; c++) {
    const votes = coreVotes[c] ?? 0;
    const best = coreVotes[core] ?? 0;
    if (votes > best || (votes === best && c < core)) core = c;
  }

  const valid = VALID_WINGS[core];
  const wingVotes = wingByCore[core] ?? {};
  let wing = valid[0];
  for (const w of valid) {
    const vw = wingVotes[w] ?? 0;
    const bw = wingVotes[wing] ?? 0;
    if (vw > bw || (vw === bw && w < wing)) wing = w;
  }

  const bounds = boundsFor(questions);
  const normDims = emptyDims();
  for (const d of DIMS) {
    const { min, max } = bounds[d];
    normDims[d] =
      max === min ? 5.5 : 1 + (9 * (rawDims[d] - min)) / (max - min);
  }

  return { mbti, core, wing, rawDims, normDims };
}

function dimDist(a: Record<DimKey, number>, b: Record<DimKey, number>): number {
  let s = 0;
  for (const d of DIMS) s += (a[d] - b[d]) ** 2;
  return s;
}

export function matchHero(
  questions: Question[],
  heroes: Hero[],
  answers: OptionKey[],
): MatchResult {
  const score = scoreAnswers(questions, answers);
  const pool = heroes.filter(
    (h) =>
      h.mbti === score.mbti &&
      h.enneagram_core === score.core &&
      h.enneagram_wing === score.wing,
  );

  const candidates = pool.length > 0 ? pool : heroes;
  let best = candidates[0];
  let bestDist = dimDist(score.normDims, best.dims);
  for (let i = 1; i < candidates.length; i++) {
    const h = candidates[i];
    const d = dimDist(score.normDims, h.dims);
    if (d < bestDist || (d === bestDist && h.hero_id < best.hero_id)) {
      best = h;
      bestDist = d;
    }
  }

  return { score, hero: best };
}
