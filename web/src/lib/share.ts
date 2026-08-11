import type { OptionKey } from "./types";

const KEYS: OptionKey[] = ["A", "B", "C", "D"];

/** Encode 32 answers as a compact base64url payload for share URLs. */
export function encodeAnswers(answers: OptionKey[]): string {
  if (answers.some((a) => !KEYS.includes(a))) {
    throw new Error("Invalid option key");
  }
  // 2 bits per answer → pack into bytes
  const bits: number[] = [];
  let buf = 0;
  let n = 0;
  for (const a of answers) {
    buf = (buf << 2) | KEYS.indexOf(a);
    n += 2;
    if (n >= 8) {
      bits.push((buf >> (n - 8)) & 0xff);
      n -= 8;
      buf &= (1 << n) - 1;
    }
  }
  if (n > 0) bits.push((buf << (8 - n)) & 0xff);
  const bytes = Uint8Array.from(bits);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeAnswers(
  payload: string,
  expectedLength: number,
): OptionKey[] | null {
  try {
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
    const bin = atob(b64 + pad);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const answers: OptionKey[] = [];
    for (let i = 0; i < bytes.length && answers.length < expectedLength; i++) {
      const byte = bytes[i];
      for (const shift of [6, 4, 2, 0]) {
        if (answers.length >= expectedLength) break;
        const idx = (byte >> shift) & 0b11;
        answers.push(KEYS[idx]);
      }
    }
    if (answers.length !== expectedLength) return null;
    return answers;
  } catch {
    return null;
  }
}

/** Human-readable fallback: raw ABCD string also accepted. */
export function parseAnswerParam(
  raw: string | null,
  expectedLength: number,
): OptionKey[] | null {
  if (!raw) return null;
  if (/^[ABCD]+$/i.test(raw) && raw.length === expectedLength) {
    return raw.toUpperCase().split("") as OptionKey[];
  }
  return decodeAnswers(raw, expectedLength);
}
