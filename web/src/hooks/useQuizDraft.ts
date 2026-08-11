import { useCallback, useEffect, useState } from "react";
import type { OptionKey } from "../lib/types";

const STORAGE_KEY = "doti.quiz.draft.v1";

export interface QuizDraft {
  answers: Partial<Record<number, OptionKey>>;
  index: number;
  updatedAt: number;
}

function readDraft(): QuizDraft | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as QuizDraft;
  } catch {
    return null;
  }
}

function writeDraft(draft: QuizDraft) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

export function clearQuizDraft() {
  localStorage.removeItem(STORAGE_KEY);
}

export function hasQuizDraft(): boolean {
  const d = readDraft();
  return !!d && Object.keys(d.answers).length > 0;
}

export function useQuizDraft(questionCount: number) {
  const [draft, setDraft] = useState<QuizDraft>(() => {
    const existing = readDraft();
    if (existing) return existing;
    return { answers: {}, index: 0, updatedAt: Date.now() };
  });

  useEffect(() => {
    writeDraft(draft);
  }, [draft]);

  const setAnswer = useCallback((questionIndex: number, key: OptionKey) => {
    setDraft((prev) => ({
      ...prev,
      answers: { ...prev.answers, [questionIndex]: key },
      updatedAt: Date.now(),
    }));
  }, []);

  const setIndex = useCallback((index: number) => {
    setDraft((prev) => ({
      ...prev,
      index: Math.max(0, Math.min(questionCount - 1, index)),
      updatedAt: Date.now(),
    }));
  }, [questionCount]);

  const reset = useCallback(() => {
    clearQuizDraft();
    setDraft({ answers: {}, index: 0, updatedAt: Date.now() });
  }, []);

  return {
    draft,
    setAnswer,
    setIndex,
    reset,
  };
}
