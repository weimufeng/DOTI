#!/usr/bin/env python3
"""Download original Valve hero portraits into web/public/portraits/*.png."""
from __future__ import annotations

import json
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HEROES = ROOT / "web" / "src" / "data" / "heroes.json"
OUT = ROOT / "web" / "public" / "portraits"
CDN = "https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes"
WORKERS = 8


def slug_of(hero: dict) -> str:
    return hero["portrait_url"].rsplit("/", 1)[-1].removesuffix(".png")


def fetch_one(slug: str) -> tuple[str, str]:
    OUT.mkdir(parents=True, exist_ok=True)
    dest = OUT / f"{slug}.png"
    if dest.exists() and dest.stat().st_size > 5_000:
        return slug, "skip"

    url = f"{CDN}/{slug}.png"
    req = urllib.request.Request(url, headers={"User-Agent": "DOTI-portrait-fetch/1.0"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        dest.write_bytes(resp.read())
    return slug, f"ok:{dest.stat().st_size}"


def main() -> None:
    heroes = json.loads(HEROES.read_text(encoding="utf-8"))
    slugs = [slug_of(h) for h in heroes]
    print(f"fetching {len(slugs)} portraits → {OUT}")
    ok = skip = fail = 0
    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        futs = {pool.submit(fetch_one, s): s for s in slugs}
        for fut in as_completed(futs):
            slug = futs[fut]
            try:
                _, status = fut.result()
                if status == "skip":
                    skip += 1
                else:
                    ok += 1
                print(f"  {slug}: {status}")
            except Exception as e:
                fail += 1
                print(f"  {slug}: FAIL {e}")
    print(f"done ok={ok} skip={skip} fail={fail}")
    if fail:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
