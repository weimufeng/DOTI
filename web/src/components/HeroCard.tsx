import { useEffect, useState } from "react";
import { heroPortraitSrc } from "../lib/heroMedia";
import type { Hero } from "../lib/types";
import "./HeroCard.css";

async function toDataUrl(url: string): Promise<string> {
  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  if (blob.size < 500) throw new Error("empty image");
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.readAsDataURL(blob);
  });
}

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

  useEffect(() => {
    let cancelled = false;
    setImgFailed(false);
    setSrc(localSrc);

    toDataUrl(localSrc)
      .then((dataUrl) => {
        if (!cancelled) setSrc(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setSrc(hero.portrait_url);
      });

    return () => {
      cancelled = true;
    };
  }, [localSrc, hero.portrait_url]);

  function onImgError() {
    if (src.startsWith("data:") || src === localSrc) {
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
            data-local-src={localSrc}
            loading="eager"
            decoding="async"
            referrerPolicy="no-referrer"
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
