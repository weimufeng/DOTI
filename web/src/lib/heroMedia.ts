import type { Hero } from "./types";

export function heroSlug(hero: Hero): string {
  const fromPortrait = hero.portrait_url.split("/").pop()?.replace(/\.png$/i, "");
  if (fromPortrait) return fromPortrait;
  return hero.internal_name.replace(/^npc_dota_hero_/, "");
}

/** Same-origin copy of Valve portrait (for display + poster capture). */
export function heroPortraitSrc(hero: Hero): string {
  return `/portraits/${heroSlug(hero)}.png`;
}
