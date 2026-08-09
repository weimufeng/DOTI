#!/usr/bin/env python3
"""Verify quiz bank reachability against the hero personality workbook.

Metrics:
  enne18    — all 18 valid core+wing combinations constructable
  mbti16    — all 16 MBTI types reachable (DP on letter deltas)
  type_ok   — each hero's exact MBTI + enneagram is reconstructable
  pool_top1 — given that type, hero is unique nearest neighbor on 10 dims

Pass bar (可达性达标): enne18==18 and mbti16==16 and type_ok==127.

Usage: python3 scripts/verify-question-bank-coverage.py
"""
from __future__ import annotations

import json
import random
import sys
import zipfile
import xml.etree.ElementTree as ET
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
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
VALID = {
    1: {9, 2},
    2: {1, 3},
    3: {2, 4},
    4: {3, 5},
    5: {4, 6},
    6: {5, 7},
    7: {6, 8},
    8: {7, 9},
    9: {8, 1},
}
MBTI_PAIRS = [("E", "I"), ("S", "N"), ("T", "F"), ("J", "P")]


def load_questions():
    return json.loads((ROOT / "data/题库.txt").read_text(encoding="utf-8"))


def load_heroes():
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
        heroes.append(
            {
                "name": g("hero_name_en"),
                "mbti": g("mbti"),
                "core": int(float(g("enneagram_core"))),
                "wing": int(float(g("enneagram_wing"))),
                "vec": {dim: float(g(dim)) for dim in DIMS},
            }
        )
    return heroes


def score(choices):
    mbti = Counter()
    cores = Counter()
    wing_by = defaultdict(Counter)
    dims = Counter()
    for o in choices:
        for k, v in o.get("mbti", {}).items():
            mbti[k] += v
        c = o["enneagram"]["core"]
        w = o["enneagram"]["wing"]
        cores[c] += 1
        wing_by[c][w] += 1
        for k, v in o.get("dims", {}).items():
            dims[k] += v
    letters = "".join(
        (
            a
            if mbti[a] > mbti[b]
            else (b if mbti[b] > mbti[a] else a)
        )
        for a, b in MBTI_PAIRS
    )
    core = sorted(range(1, 10), key=lambda c: (-cores[c], c))[0]
    wing = max(VALID[core], key=lambda w: (wing_by[core][w], -w))
    return letters, core, wing, dims, mbti, cores


def construct_enne(qs, tc, tw):
    counts = Counter()
    choices = []
    for q in qs:
        exact = [
            o
            for o in q["options"]
            if o["enneagram"]["core"] == tc and o["enneagram"]["wing"] == tw
        ]
        if exact:
            o = exact[0]
        else:
            cands = [
                o
                for o in q["options"]
                if not (
                    o["enneagram"]["core"] == tc and o["enneagram"]["wing"] != tw
                )
            ]
            o = min(
                cands or q["options"],
                key=lambda o: (
                    counts[o["enneagram"]["core"]],
                    abs(o["enneagram"]["core"] - tc),
                ),
            )
        choices.append(o)
        counts[o["enneagram"]["core"]] += 1
    return score(choices)[:3]


def mbti_reachable(qs):
    states = {(0, 0, 0, 0)}
    for q in qs:
        new = set()
        for st in states:
            for o in q["options"]:
                m = o.get("mbti", {})
                new.add(
                    (
                        st[0] + m.get("E", 0) - m.get("I", 0),
                        st[1] + m.get("S", 0) - m.get("N", 0),
                        st[2] + m.get("T", 0) - m.get("F", 0),
                        st[3] + m.get("J", 0) - m.get("P", 0),
                    )
                )
        states = new
    return len(
        {
            ("E" if e >= 0 else "I")
            + ("S" if s >= 0 else "N")
            + ("T" if t >= 0 else "F")
            + ("J" if j >= 0 else "P")
            for e, s, t, j in states
        }
    )


def bounds(qs):
    b = {}
    for d in DIMS:
        poss = {0}
        for q in qs:
            poss = {s + o.get("dims", {}).get(d, 0) for s in poss for o in q["options"]}
        b[d] = (min(poss), max(poss))
    return b


def norm(raw, B):
    out = {}
    for d in DIMS:
        lo, hi = B[d]
        out[d] = 5.5 if hi == lo else 1 + 9 * (raw.get(d, 0) - lo) / (hi - lo)
    return out


def dim_dist(u, h):
    return sum((u[d] - h["vec"][d]) ** 2 for d in DIMS)


def construct_hero(qs, hero, groups, B):
    tc, tw = hero["core"], hero["wing"]
    target = list(hero["mbti"])
    pool = groups[(hero["mbti"], tc, tw)]
    mean = {d: sum(x["vec"][d] for x in pool) / len(pool) for d in DIMS}
    idxs = [0] * len(qs)
    for i, q in enumerate(qs):
        bestj, bestk = 0, None
        for j, o in enumerate(q["options"]):
            e = o["enneagram"]
            mb = o.get("mbti", {})
            enne = (
                0
                if (e["core"] == tc and e["wing"] == tw)
                else (5 if e["core"] == tc else 2)
            )
            letter = sum(mb.get(L, 0) for L in target)
            anti = sum(mb.get(L, 0) for L in "EISNTFJP" if L not in target)
            dim = sum(
                o.get("dims", {}).get(d, 0) * (hero["vec"][d] - mean[d]) for d in DIMS
            )
            k = (enne, -letter, anti, -dim)
            if bestk is None or k < bestk:
                bestk, bestj = k, j
        idxs[i] = bestj

    def type_of(ix):
        return score([qs[i]["options"][ix[i]] for i in range(len(qs))])

    def letter_m(mbti):
        s = 0
        for ii, (a, b) in enumerate(MBTI_PAIRS):
            want = hero["mbti"][ii]
            sa, sb = mbti[a], mbti[b]
            s += (sa - sb) if want == a else (sb - sa)
        return s

    for _ in range(16):
        improved = False
        for i in range(len(qs)):
            for j in range(4):
                if idxs[i] == j:
                    continue
                trial = idxs[:]
                trial[i] = j
                L, C, W, _, mbti, cores = type_of(trial)
                L2, C2, W2, _, mbti2, cores2 = type_of(idxs)
                obj = (
                    1 if (L, C, W) == (hero["mbti"], tc, tw) else 0,
                    cores[tc],
                    letter_m(mbti),
                )
                obj2 = (
                    1 if (L2, C2, W2) == (hero["mbti"], tc, tw) else 0,
                    cores2[tc],
                    letter_m(mbti2),
                )
                if obj > obj2:
                    idxs = trial
                    improved = True
        if not improved:
            break

    L, C, W, _, _, _ = type_of(idxs)
    if (L, C, W) != (hero["mbti"], tc, tw):
        return False, False, 999, (L, C, W)

    def eval_all(ix):
        ch = [qs[i]["options"][ix[i]] for i in range(len(qs))]
        letters, core, wing, dims, _, _ = score(ch)
        if (letters, core, wing) != (hero["mbti"], tc, tw):
            return None
        u = norm(dims, B)
        hero_d = dim_dist(u, hero)
        if len(pool) == 1:
            return (1, 0, hero_d)
        rival_d = min(dim_dist(u, h) for h in pool if h["name"] != hero["name"])
        rank = sum(1 for h in pool if dim_dist(u, h) < hero_d - 1e-12) + 1
        return (rank, -(rival_d - hero_d), hero_d)

    best = eval_all(idxs)
    rng = random.Random(hash(hero["name"]) % 10**6)
    for _ in range(50):
        improved = False
        order = list(range(len(qs)))
        rng.shuffle(order)
        for i in order:
            for j in range(4):
                if idxs[i] == j:
                    continue
                trial = idxs[:]
                trial[i] = j
                pr = eval_all(trial)
                if pr is None:
                    continue
                if pr < best:
                    best = pr
                    idxs = trial
                    improved = True
        if not improved:
            break
    return True, best[0] == 1, best[0], (L, C, W)


def main():
    qs = load_questions()
    heroes = load_heroes()
    groups = defaultdict(list)
    for h in heroes:
        groups[(h["mbti"], h["core"], h["wing"])].append(h)

    enne18 = sum(
        1
        for c in range(1, 10)
        for w in VALID[c]
        if construct_enne(qs, c, w)[1:] == (c, w)
    )
    mbti16 = mbti_reachable(qs)
    B = bounds(qs)

    type_ok = top1 = 0
    miss_type = []
    miss_sep = []
    for h in heroes:
        tok, top, rank, got = construct_hero(qs, h, groups, B)
        if tok:
            type_ok += 1
        if top:
            top1 += 1
        elif not tok:
            miss_type.append((h["name"], h["mbti"], f"{h['core']}w{h['wing']}", got))
        else:
            miss_sep.append(h["name"])

    n = len(heroes)
    passed = enne18 == 18 and mbti16 == 16 and type_ok == n
    print(f"questions {len(qs)}")
    print(f"enne18 {enne18}/18")
    print(f"mbti16 {mbti16}/16")
    print(f"type_ok {type_ok}/{n}")
    print(f"pool_top1 {top1}/{n} ({100 * top1 / n:.1f}%)")
    if miss_type:
        print("TYPE_MISS", miss_type)
    if miss_sep:
        print("SEP_MISS", miss_sep)
    print("PASS" if passed else "FAIL")
    return 0 if passed else 1


if __name__ == "__main__":
    sys.exit(main())
