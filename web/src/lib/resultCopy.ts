import type { Hero } from "./types";
import copyDb from "../data/hero-result-copy.json";

export interface HeroResultCopy {
  hero_id: number;
  name_en: string;
  name_zh: string;
  /** 例：你的本命英雄是：敌法师 */
  headline: string;
  /** 例：在DOTA2的世界里，你是斩断魔力的独行剑客。 */
  world_line: string;
  /** 5–8 句完全独立的人格说明（勿用跨英雄模版句） */
  paragraphs: string[];
}

const db = copyDb as Record<string, HeroResultCopy>;

export function getHeroResultCopy(hero: Hero): HeroResultCopy {
  const hit = db[String(hero.hero_id)];
  if (hit) return hit;
  return {
    hero_id: hero.hero_id,
    name_en: hero.name_en,
    name_zh: hero.name_zh,
    headline: `你的本命英雄是：${hero.name_zh}`,
    world_line: `在DOTA2的世界里，你是与「${hero.name_zh}」同频的那个人。`,
    paragraphs: [
      `你的人格画像落在 ${hero.mbti} · ${hero.enneagram_core}w${hero.enneagram_wing}，与这位英雄的动机结构高度接近。`,
      "你做事有自己的节奏与取舍，不轻易被外界噪声改写方向。",
      "这份匹配来自答题中的稳定倾向，仅供娱乐，不构成心理评估。",
    ],
  };
}
