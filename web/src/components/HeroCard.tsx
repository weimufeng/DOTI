import { useState } from "react";
import { heroPortraitSrc } from "../lib/heroMedia";
import type { Hero } from "../lib/types";
import "./HeroCard.css";

export function HeroCard({
  hero,
  enneagram,
  mbti,
}: {
  hero: Hero;
  enneagram?: string;
  mbti?: string;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const tagMbti = mbti ?? hero.mbti;
  const tagEnne =
    enneagram ?? `${hero.enneagram_core}w${hero.enneagram_wing}`;

  return (
    <article className="hero-card">
      <div className="hero-card__art">
        {!imgFailed ? (
          <img
            src={heroPortraitSrc(hero)}
            alt={hero.name_zh}
            loading="eager"
            decoding="sync"
            // Same-origin only — CDN fallback would show on screen but capture as black.
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="hero-card__fallback" aria-hidden>
            {hero.name_zh.slice(0, 1)}
          </div>
        )}
      </div>
      <div className="hero-card__body">
        <h2 className="hero-card__name">{hero.name_zh}</h2>
        <p className="hero-card__en">{hero.name_en}</p>
        <div className="hero-card__tags">
          <span>{tagMbti}</span>
          <span>{tagEnne}</span>
        </div>
      </div>
    </article>
  );
}
