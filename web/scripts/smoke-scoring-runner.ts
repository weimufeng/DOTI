import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { matchHero } from "../src/lib/scoring.ts";
import { encodeAnswers, parseAnswerParam } from "../src/lib/share.ts";
import type { Hero, OptionKey, Question } from "../src/lib/types.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(webRoot, "..");

const questions = JSON.parse(
  fs.readFileSync(path.join(webRoot, "src/data/questions.json"), "utf8"),
) as Question[];
const heroes = JSON.parse(
  fs.readFileSync(path.join(webRoot, "src/data/heroes.json"), "utf8"),
) as Hero[];
const examples = JSON.parse(
  fs.readFileSync(path.join(repoRoot, "data/hero-answer-examples.json"), "utf8"),
) as { name: string; answers: string }[];

const sampleNames = [
  "Abaddon",
  "Axe",
  "Anti-Mage",
  "Invoker",
  "Pudge",
  "Crystal Maiden",
  "Techies",
  "Juggernaut",
  "Ringmaster",
  "Zeus",
  "Phantom Assassin",
  "Earthshaker",
];

let ok = 0;
let fail = 0;
for (const name of sampleNames) {
  const ex = examples.find((e) => e.name === name);
  if (!ex) {
    console.error("missing example", name);
    fail++;
    continue;
  }
  const answers = ex.answers.split("") as OptionKey[];
  const match = matchHero(questions, heroes, answers);
  const enc = encodeAnswers(answers);
  const dec = parseAnswerParam(enc, questions.length);
  const roundTrip = !!dec && dec.join("") === ex.answers;
  const hit = match.hero.name_en === name;
  if (hit && roundTrip) {
    ok++;
    console.log(
      "OK",
      name,
      "→",
      match.hero.name_zh,
      match.score.mbti,
      `${match.score.core}w${match.score.wing}`,
    );
  } else {
    fail++;
    console.error("FAIL", name, "got", match.hero.name_en, "roundTrip", roundTrip);
  }
}

console.log(`smoke ${ok}/${sampleNames.length} passed`);
process.exit(fail ? 1 : 0);
