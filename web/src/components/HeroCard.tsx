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
  const localSrc = heroPortraitSrc(hero);
  const [src, setSrc] = useState(localSrc);
  const [imgFailed, setImgFailed] = useState(false);
  const tagMbti = mbti ?? hero.mbti;
  const tagEnne =
    enneagram ?? `${hero.enneagram_core}w${hero.enneagram_wing}`;

  function onImgError() {
    if (src !== hero.portrait_url) {
      setSrc(hero.portrait_url);
      return;
    }
    setImgFailed(true);
  }

  return (
    <article className="hero-card">
      <div className="hero-card__art">
        {!imgFailed ? (
          <img
            src={src}
            alt={hero.name_zh}
            loading="eager"
            decoding="async"
            onError={onImgError}
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
