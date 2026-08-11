import { useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import heroes from "../data/heroes.json";
import questions from "../data/questions.json";
import { DimRadar } from "../components/DimRadar";
import { HeroCard } from "../components/HeroCard";
import { ShareBar } from "../components/ShareBar";
import { matchHero } from "../lib/scoring";
import { getHeroResultCopy } from "../lib/resultCopy";
import { parseAnswerParam } from "../lib/share";
import type { Hero, Question } from "../lib/types";
import "./Result.css";

const qs = questions as Question[];
const heroList = heroes as Hero[];

export function Result() {
  const [params] = useSearchParams();
  const raw = params.get("a");
  const captureRef = useRef<HTMLDivElement>(null);

  const parsed = useMemo(() => parseAnswerParam(raw, qs.length), [raw]);

  const match = useMemo(() => {
    if (!parsed) return null;
    try {
      return matchHero(qs, heroList, parsed);
    } catch {
      return null;
    }
  }, [parsed]);

  if (!parsed || !match) {
    return (
      <main className="result result--empty fade-up">
        <h1>无法读取这份答卷</h1>
        <p className="muted">链接可能不完整或已损坏。</p>
        <Link className="btn" to="/quiz?fresh=1">
          重新测试
        </Link>
      </main>
    );
  }

  const { hero, score } = match;
  const enneagram = `${score.core}w${score.wing}`;
  const copy = getHeroResultCopy(hero);

  return (
    <main className="result">
      <div className="result__capture" ref={captureRef}>
        <p className="result__eyebrow faint brand">DOTI · 本命英雄</p>
        <h1 className="result__heading">{copy.headline}</h1>

        <div>
          <HeroCard hero={hero} mbti={score.mbti} enneagram={enneagram} />
        </div>

        <section className="result__block result__copy">
          <p className="result__world">{copy.world_line}</p>
          <div className="result__paragraphs">
            {copy.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </section>

        <section className="result__block result__radar">
          <DimRadar values={score.normDims} />
        </section>
      </div>

      <section className="result__block" data-capture-ignore>
        <ShareBar
          captureRef={captureRef}
          fileName={`DOTI-${hero.name_zh}-本命英雄.png`}
        />
      </section>

      <div className="result__actions" data-capture-ignore>
        <Link className="btn btn-ghost" to="/">
          回到首页
        </Link>
      </div>

      <p className="result__disclaimer faint" data-capture-ignore>
        仅供娱乐，不构成心理评估。非 Valve / DOTA2 官方产品。人格标签为创意匹配，相同答卷将得到相同结果。
      </p>
    </main>
  );
}
