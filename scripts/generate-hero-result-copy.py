#!/usr/bin/env python3
"""Hero result copy is handcrafted in web/src/data/hero-result-copy.json.

Do NOT regenerate from dimension templates — each hero's paragraphs must be
unique prose (5–8 sentences). Edit the JSON directly, or merge curated batches.

This script only validates the database.
"""
from __future__ import annotations

import json
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COPY = ROOT / "web" / "src" / "data" / "hero-result-copy.json"
HEROES = ROOT / "web" / "src" / "data" / "heroes.json"


def main() -> int:
    heroes = json.loads(HEROES.read_text(encoding="utf-8"))
    copy = json.loads(COPY.read_text(encoding="utf-8"))
    missing = [h["hero_id"] for h in heroes if str(h["hero_id"]) not in copy]
    if missing:
        print("MISSING", missing)
        return 1
    paras = []
    for h in heroes:
        c = copy[str(h["hero_id"])]
        if not c["headline"] == f"你的本命英雄是：{h['name_zh']}":
            print("HEADLINE", h["name_zh"], c["headline"])
            return 1
        if not c["world_line"].startswith("在DOTA2的世界里，你是"):
            print("WORLD", h["name_zh"])
            return 1
        n = len(c["paragraphs"])
        if not 5 <= n <= 8:
            print("COUNT", h["name_zh"], n)
            return 1
        paras.extend(c["paragraphs"])
    dups = [p for p, n in Counter(paras).items() if n > 1]
    if dups:
        print("DUP paragraphs:", len(dups))
        print(dups[:5])
        return 1
    print(f"OK {len(heroes)} heroes, {len(paras)} unique paragraphs")
    return 0


if __name__ == "__main__":
    sys.exit(main())
