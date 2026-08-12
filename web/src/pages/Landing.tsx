import { Link } from "react-router-dom";
import { TipSupport } from "../components/TipSupport";
import { hasQuizDraft } from "../hooks/useQuizDraft";
import { AnalyticsEvents, trackEvent } from "../lib/analytics";
import "./Landing.css";

export function Landing() {
  const canResume = hasQuizDraft();

  return (
    <main className="landing fade-up">
      <p className="landing__eyebrow faint">TI 季限定 · 娱乐向人格测试</p>
      <h1 className="landing__brand brand">DOTI</h1>
      <p className="landing__title">测测你的 DOTA2 本命英雄</p>
      <p className="landing__lead muted">
        32 道情境题，约 3–5 分钟。从 MBTI、九型与十维画像中，找到你的DOTA2本命英雄。
      </p>

      <div className="landing__actions">
        <Link
          className="btn landing__cta"
          to="/quiz?fresh=1"
          onClick={() => trackEvent(AnalyticsEvents.quizStart)}
        >
          开始测试
        </Link>
        {canResume ? (
          <Link
            className="btn btn-ghost"
            to="/quiz"
            onClick={() => trackEvent(AnalyticsEvents.quizResume)}
          >
            继续未完成的测试
          </Link>
        ) : null}
      </div>

      <TipSupport className="landing__tip" />
    </main>
  );
}
