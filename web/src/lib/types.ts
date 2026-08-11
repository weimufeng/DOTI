export type MBTILetter = "E" | "I" | "S" | "N" | "T" | "F" | "J" | "P";

export type DimKey =
  | "Aggression"
  | "Power"
  | "Leadership"
  | "Knowledge"
  | "Freedom"
  | "Honor"
  | "Protection"
  | "Chaos"
  | "Social"
  | "Ambition";

export type OptionKey = "A" | "B" | "C" | "D";

export interface QuestionOption {
  key: OptionKey;
  text: string;
  mbti: Partial<Record<MBTILetter, number>>;
  enneagram: { core: number; wing: number };
  dims: Partial<Record<DimKey, number>>;
}

export interface Question {
  id: number;
  question: string;
  options: QuestionOption[];
}

export interface Hero {
  hero_id: number;
  internal_name: string;
  name_en: string;
  name_zh: string;
  mbti: string;
  enneagram_core: number;
  enneagram_wing: number;
  dims: Record<DimKey, number>;
  portrait_url: string;
}

export interface ScoreResult {
  mbti: string;
  core: number;
  wing: number;
  rawDims: Record<DimKey, number>;
  normDims: Record<DimKey, number>;
}

export interface MatchResult {
  score: ScoreResult;
  hero: Hero;
}
