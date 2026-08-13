import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import questions from "../data/questions.json";
import { OptionButton } from "../components/OptionButton";
import { Progress } from "../components/Progress";
import { clearQuizDraft, useQuizDraft } from "../hooks/useQuizDraft";
import { markQuizJustCompleted } from "../lib/analytics";
import { encodeAnswers } from "../lib/share";
import type { OptionKey, Question } from "../lib/types";
import "./Quiz.css";

const qs = questions as Question[];
const SELECT_ADVANCE_MS = 280;

/** Nearest unanswered index after `fromIndex`, then wrap from the start. */
function findNextUnanswered(
  fromIndex: number,
  answers: Partial<Record<number, OptionKey>>,
  patchIndex: number,
  patchKey: OptionKey,
): number | null {
  const at = (i: number) => (i === patchIndex ? patchKey : answers[i]);
  for (let i = fromIndex + 1; i < qs.length; i++) {
    if (!at(i)) return i;
  }
  for (let i = 0; i <= fromIndex; i++) {
    if (!at(i)) return i;
  }
  return null;
}

export function Quiz() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { draft, setAnswer, setIndex, reset } = useQuizDraft(qs.length);
  const [slideDir, setSlideDir] = useState<"next" | "prev">("next");
  const [busy, setBusy] = useState(false);
  const advanceTimer = useRef<number | null>(null);

  useEffect(() => {
    if (params.get("fresh") === "1") {
      reset();
      navigate("/quiz", { replace: true });
    }
  }, [params, reset, navigate]);

  useEffect(() => {
    return () => {
      if (advanceTimer.current != null) window.clearTimeout(advanceTimer.current);
    };
  }, []);

  const index = draft.index;
  const question = qs[index];
  const selected = draft.answers[index];
  const answeredCount = Object.keys(draft.answers).length;
  const allAnswered = answeredCount === qs.length;
  const canSubmit = allAnswered && !busy;

  const progressLabel = useMemo(
    () => `${answeredCount}/${qs.length}`,
    [answeredCount],
  );

  function buildAnswers(patchIndex: number, key: OptionKey): OptionKey[] | null {
    const answers: OptionKey[] = [];
    for (let i = 0; i < qs.length; i++) {
      const a = i === patchIndex ? key : draft.answers[i];
      if (!a) return null;
      answers.push(a);
    }
    return answers;
  }

  function submitAnswers(answers: OptionKey[]) {
    const token = encodeAnswers(answers);
    clearQuizDraft();
    markQuizJustCompleted();
    navigate(`/result?a=${token}`);
  }

  function goToIndex(nextIndex: number, dir: "next" | "prev") {
    setSlideDir(dir);
    setIndex(nextIndex);
  }

  function choose(key: OptionKey) {
    if (busy) return;
    const wasIncomplete =
      answeredCount < qs.length || draft.answers[index] == null;
    setAnswer(index, key);
    setBusy(true);

    if (advanceTimer.current != null) window.clearTimeout(advanceTimer.current);
    advanceTimer.current = window.setTimeout(() => {
      const nextOpen = findNextUnanswered(index, draft.answers, index, key);
      setBusy(false);

      if (nextOpen == null) {
        const answers = buildAnswers(index, key);
        if (!answers) return;
        // Newly completed → result; editing an already-complete quiz → last question.
        if (wasIncomplete) {
          submitAnswers(answers);
        } else {
          goToIndex(qs.length - 1, index < qs.length - 1 ? "next" : "prev");
        }
        return;
      }

      goToIndex(nextOpen, nextOpen > index ? "next" : "prev");
    }, SELECT_ADVANCE_MS);
  }

  function goPrev() {
    if (busy || index === 0) return;
    if (advanceTimer.current != null) {
      window.clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
      setBusy(false);
    }
    goToIndex(index - 1, "prev");
  }

  function submitFromBar() {
    if (!canSubmit || selected == null) return;
    const answers = buildAnswers(index, selected);
    if (answers) submitAnswers(answers);
  }

  return (
    <main className="quiz">
      <header className="quiz__header">
        <button
          type="button"
          className="btn btn-ghost quiz__back-home"
          onClick={() => navigate("/")}
        >
          DOTI
        </button>
        <span className="faint">{progressLabel} 已答</span>
      </header>

      <Progress current={index} total={qs.length} />

      <div className="quiz__viewport">
        <section
          className={`quiz__panel quiz__panel--${slideDir}`}
          key={question.id}
        >
          <div className="quiz__stem">
            <h1 className="quiz__question">{question.question}</h1>
          </div>
          <div className="quiz__options">
            {question.options.map((o) => (
              <OptionButton
                key={o.key}
                optionKey={o.key}
                text={o.text}
                selected={selected === o.key}
                onSelect={() => choose(o.key)}
              />
            ))}
          </div>
        </section>
      </div>

      <footer className={`quiz__footer ${allAnswered ? "quiz__footer--last" : ""}`}>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={goPrev}
          disabled={index === 0 || busy}
        >
          上一题
        </button>
        {allAnswered ? (
          <button
            type="button"
            className="btn"
            onClick={submitFromBar}
            disabled={!canSubmit || selected == null}
          >
            查看本命英雄
          </button>
        ) : (
          <p className="quiz__hint faint">选择后跳到下一道未答题</p>
        )}
      </footer>
    </main>
  );
}
