import { useCallback, useEffect, useState } from "react";
import type { OptionKey } from "../lib/types";

const STORAGE_KEY = "doti.quiz.draft.v1";
const OPTION_KEYS: OptionKey[] = ["A", "B", "C", "D"];

export interface QuizDraft {
  answers: Partial<Record<number, OptionKey>>;
  index: number;
  updatedAt: number;
}

function emptyDraft(): QuizDraft {
  return { answers: {}, index: 0, updatedAt: Date.now() };
}

function sanitizeDraft(
  raw: unknown,
  questionCount: number,
): QuizDraft | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;
  if (!d.answers || typeof d.answers !== "object") return null;

  const answers: Partial<Record<number, OptionKey>> = {};
  for (const [k, v] of Object.entries(d.answers as Record<string, unknown>)) {
    const i = Number(k);
    if (!Number.isInteger(i) || i < 0 || i >= questionCount) continue;
    if (typeof v === "string" && OPTION_KEYS.includes(v as OptionKey)) {
      answers[i] = v as OptionKey;
    }
  }

  const maxIndex = Math.max(0, questionCount - 1);
  const rawIndex =
    typeof d.index === "number" && Number.isFinite(d.index)
      ? Math.trunc(d.index)
      : 0;

  return {
    answers,
    index: Math.max(0, Math.min(maxIndex, rawIndex)),
    updatedAt: typeof d.updatedAt === "number" ? d.updatedAt : Date.now(),
  };
}

function readDraft(): unknown {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeDraft(draft: QuizDraft) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    /* private mode / quota */
  }
}

export function clearQuizDraft() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function hasQuizDraft(): boolean {
  const d = readDraft();
  if (!d || typeof d !== "object") return false;
  const answers = (d as { answers?: unknown }).answers;
  if (!answers || typeof answers !== "object") return false;
  return Object.keys(answers).length > 0;
}

export function useQuizDraft(questionCount: number) {
  const [draft, setDraft] = useState<QuizDraft>(() => {
    return sanitizeDraft(readDraft(), questionCount) ?? emptyDraft();
  });

  useEffect(() => {
    writeDraft(draft);
  }, [draft]);

  const setAnswer = useCallback((questionIndex: number, key: OptionKey) => {
    if (questionIndex < 0 || questionIndex >= questionCount) return;
    setDraft((prev) => ({
      ...prev,
      answers: { ...prev.answers, [questionIndex]: key },
      updatedAt: Date.now(),
    }));
  }, [questionCount]);

  const setIndex = useCallback((index: number) => {
    setDraft((prev) => ({
      ...prev,
      index: Math.max(0, Math.min(questionCount - 1, index)),
      updatedAt: Date.now(),
    }));
  }, [questionCount]);

  const reset = useCallback(() => {
    clearQuizDraft();
    setDraft(emptyDraft());
  }, []);

  return {
    draft,
    setAnswer,
    setIndex,
    reset,
  };
}
