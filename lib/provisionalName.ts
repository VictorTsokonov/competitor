// A readable stand-in name built from a statement's opening words, shown
// in Sets while the model writes the real title (lib/autoName.ts). Pure
// text work, no model: drop a "Problem 2." label, keep tiny formulas as
// plain text ("$n+1$" -> "n+1"), stop at a long one, and keep about six
// words. Statements arrive as LaTeX ($...$) or as plain Unicode maths.

const UNTITLED = "Untitled problem";
const MAX_WORDS = 6;
const MAX_CHARS = 40;
// Non-space characters a formula may have and still be kept in a name.
const SHORT_MATHS = 8;
// Stands in for a dropped formula; never part of a typed statement.
const CUT = "\u0000";

const TEX_SYMBOLS: Record<string, string> = {
  le: "≤", leq: "≤", ge: "≥", geq: "≥", ne: "≠", neq: "≠", in: "∈",
  infty: "∞", cdot: "·", times: "×", pm: "±", alpha: "α", beta: "β",
  gamma: "γ", delta: "δ", epsilon: "ε", varepsilon: "ε", lambda: "λ",
  mu: "μ", pi: "π", sigma: "σ", theta: "θ", omega: "ω", sqrt: "√", to: "→",
};

const MATHS = /\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)|\$([^$]*)\$/g;
const LABEL =
  /^(?:(?:problem|question|exercise|task|q|p)\s*\d+[a-z]?|\(?[a-z0-9]{1,3}\)|\d+\.)\s*[.):]?(?:\s+|$)/i;
const SENTENCE_END = new RegExp(`(?<=[.?!])\\s+(?=[A-Z("'${CUT}])`);

// "n+1" stays, "\binom{2020}{0}" does not.
function shortMaths(tex: string): string | null {
  const plain = tex
    .replace(/\\(?:left|right|mathbb|mathrm|mathcal|mathbf|text|operatorname)\b/g, "")
    .replace(/\\([A-Za-z]+)/g, (m: string, name: string) => TEX_SYMBOLS[name] ?? m)
    .replace(/[{}\s]/g, "");
  if (!plain || plain.includes("\\") || plain.length > SHORT_MATHS) return null;
  return plain;
}

function isWord(token: string): boolean {
  const core = token.replace(/^[("'“‘]+|[)"'”’.,;:!?]+$/g, "");
  if (!/^\p{L}[\p{L}'’-]*$/u.test(core)) return false;
  // A lone letter is a variable ("Let n be"), except the English ones.
  return core.length > 1 || core === "a" || core === "A" || core === "I";
}

// Words and kept formulas from one sentence, and whether anything was cut.
function phrase(sentence: string): { pieces: string[]; cut: boolean } {
  const tokens = sentence.split(/\s+/).filter(Boolean);
  const pieces: string[] = [];
  let i = 0;
  while (i < tokens.length) {
    if (isWord(tokens[i])) {
      pieces.push(tokens[i++]);
      continue;
    }
    const run: string[] = [];
    while (i < tokens.length && !isWord(tokens[i])) run.push(tokens[i++]);
    const text = run.join(" ");
    if (text.includes(CUT) || text.replace(/\s/g, "").length > SHORT_MATHS) {
      return { pieces, cut: true };
    }
    pieces.push(text);
  }
  return { pieces, cut: false };
}

function sentences(statement: string): string[] {
  const text = statement
    .replace(MATHS, (_m: string, a?: string, b?: string, c?: string, d?: string) => {
      const kept = shortMaths(a ?? b ?? c ?? d ?? "");
      return kept === null ? ` ${CUT} ` : kept;
    })
    .replace(/[*#]/g, "");
  return text
    .split(/\n+/)
    .map((line) => line.trim().replace(/^[-•]\s+/, ""))
    .flatMap((line) => line.split(SENTENCE_END))
    .map((s) => s.trim().replace(LABEL, "").trim())
    .filter(Boolean);
}

function tidy(pieces: string[], truncated: boolean, question: boolean): string {
  let name = pieces.join(" ");
  if ((name.match(/\(/g) ?? []).length !== (name.match(/\)/g) ?? []).length) {
    name = name.replace(/[()]/g, "");
  }
  name = name.replace(/[\s,;:.!?(—–-]+$/, "");
  if (!name) return UNTITLED;
  if (name.length > MAX_CHARS) {
    name = name.slice(0, MAX_CHARS).trimEnd();
    truncated = true;
  }
  name = name.charAt(0).toUpperCase() + name.slice(1);
  return truncated ? `${name}…` : question ? `${name}?` : name;
}

export function provisionalName(statement: string): string {
  let best: { pieces: string[]; cut: boolean; sentence: string } | null = null;
  for (const sentence of sentences(statement)) {
    const p = phrase(sentence);
    if (!best || p.pieces.length > best.pieces.length) best = { ...p, sentence };
    // Three pieces read as a name; fewer ("Let") is worth one more sentence.
    if (p.pieces.length >= 3) break;
  }
  if (!best || best.pieces.length === 0) return UNTITLED;

  const pieces = best.pieces.slice(0, MAX_WORDS);
  while (pieces.length > 1 && pieces.join(" ").length > MAX_CHARS) pieces.pop();
  const truncated = best.cut || pieces.length < best.pieces.length;
  return tidy(pieces, truncated, best.sentence.endsWith("?"));
}
