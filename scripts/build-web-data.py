#!/usr/bin/env python3
"""Build web/src/data/{questions,heroes}.json from the question bank + hero workbook."""
from __future__ import annotations

import json
import ssl
import urllib.request
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "web" / "src" / "data"
DIMS = [
    "Aggression",
    "Power",
    "Leadership",
    "Knowledge",
    "Freedom",
    "Honor",
    "Protection",
    "Chaos",
    "Social",
    "Ambition",
]


def load_questions():
    raw = json.loads((ROOT / "data/题库.txt").read_text(encoding="utf-8"))
    questions = []
    for q in raw:
        questions.append(
            {
                "id": q["id"],
                "question": q["question"],
                "options": [
                    {
                        "key": o["key"],
                        "text": o["text"],
                        "mbti": o.get("mbti", {}),
                        "enneagram": o["enneagram"],
                        "dims": o.get("dims", {}),
                    }
                    for o in q["options"]
                ],
            }
        )
    return questions


def load_workbook_heroes():
    p = ROOT / "data/Dota2_hero_personality_database_archetype.xlsx"
    z = zipfile.ZipFile(p)
    ns = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
    ss = []
    root = ET.fromstring(z.read("xl/sharedStrings.xml"))
    for si in root.findall("m:si", ns):
        ss.append(
            "".join(
                t.text or ""
                for t in si.iter(
                    "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t"
                )
            )
        )
    rows = ET.fromstring(z.read("xl/worksheets/sheet1.xml")).findall(
        "m:sheetData/m:row", ns
    )

    def cell_val(c):
        t = c.attrib.get("t")
        v = c.find("m:v", ns)
        if v is None:
            return None
        return ss[int(v.text)] if t == "s" else v.text

    heroes = []
    col_of = None
    for i, r in enumerate(rows):
        d = {}
        for c in r.findall("m:c", ns):
            ref = c.attrib.get("r", "")
            col = "".join(ch for ch in ref if ch.isalpha())
            d[col] = cell_val(c)
        if i == 0:
            col_of = {d[c]: c for c in d}
            continue
        g = lambda n: d.get(col_of[n])
        if str(g("active")) in ("0", "0.0", "false", "False"):
            continue
        heroes.append(
            {
                "hero_id": int(float(g("hero_id"))),
                "internal_name": g("internal_name"),
                "name_en": g("hero_name_en"),
                "mbti": str(g("mbti")).strip(),
                "enneagram_core": int(float(g("enneagram_core"))),
                "enneagram_wing": int(float(g("enneagram_wing"))),
                "dims": {dim: float(g(dim)) for dim in DIMS},
            }
        )
    return heroes


def fetch_zh_names():
    url = "https://www.dota2.com/datafeed/herolist?language=schinese"
    ctx = ssl.create_default_context()
    try:
        with urllib.request.urlopen(url, context=ctx, timeout=30) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
        heroes = payload["result"]["data"]["heroes"]
        return {h["name"]: h["name_loc"] for h in heroes}
    except Exception as e:
        print(f"warn: could not fetch CN herolist ({e}); using English fallback")
        return {}


def portrait_url(internal_name: str) -> str:
    short = internal_name.replace("npc_dota_hero_", "")
    return (
        "https://cdn.cloudflare.steamstatic.com/apps/dota2/images/"
        f"dota_react/heroes/{short}.png"
    )


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    questions = load_questions()
    zh = fetch_zh_names()
    heroes = []
    for h in load_workbook_heroes():
        name_zh = zh.get(h["internal_name"]) or h["name_en"]
        heroes.append(
            {
                **h,
                "name_zh": name_zh,
                "portrait_url": portrait_url(h["internal_name"]),
            }
        )
    heroes.sort(key=lambda x: x["hero_id"])

    (OUT / "questions.json").write_text(
        json.dumps(questions, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    (OUT / "heroes.json").write_text(
        json.dumps(heroes, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"wrote {len(questions)} questions, {len(heroes)} heroes → {OUT}")


if __name__ == "__main__":
    main()
