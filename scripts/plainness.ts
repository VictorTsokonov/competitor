// Plainness report: how much of what the student reads is words and how
// much is notation, so the plain style (lib/providers/meta/plainStyle.ts)
// is measured rather than eyeballed. A report, not pass/fail. Printed by
// scripts/expert-pass.ts after the rubric, and runnable on saved output:
//   npx tsx scripts/plainness.ts lib/examples/example-1.json  (expert + feedback)
//   npx tsx scripts/plainness.ts lib/dummy/icmc-2020-p6.json
//   npx tsx scripts/plainness.ts chain.json        (a bare chain, e.g. expert-pass --out)
//   npx tsx scripts/plainness.ts --examples        (call A's two worked examples)

import { readFileSync } from "node:fs";
import { ChainSchema, ComparisonSchema, type Chain, type Comparison } from "../lib/schema";
import { EXAMPLE, EXAMPLE_IDENTITY } from "../lib/providers/meta/expertPrompt";

// formula marks meaning_latex / instance_latex, which may be bare LaTeX.
// Labels (terms, objects, names) are left out: they are meant to be short.
type Field = { path: string; text: string; formula: boolean };

const MATH = /\$\$[\s\S]+?\$\$|\$[^$\n]+?\$/g;

// Shorthand the plain style bans as a stand-in for a sentence.
const HEAVY: [string, RegExp][] = [
  ["\\forall", /\\forall|∀/g],
  ["\\exists", /\\exists|∃/g],
  ["\\Rightarrow", /\\Rightarrow|⇒/g],
  ["\\implies", /\\implies|⟹/g],
  ["\\iff", /\\iff|\\Leftrightarrow|⇔/g],
  ["\\to", /\\to(?![a-zA-Z])|\\mapsto|\\(long|Long)?rightarrow|→/g],
  ["\\equiv", /\\equiv|\\pmod|\\bmod|\\mod(?![a-zA-Z])|≡/g],
  ["\\sum", /\\sum|∑/g],
  ["\\prod", /\\prod|∏/g],
  ["\\mathbb", /\\mathbb|[ℕℤℚℝℂ]/g],
  ["\\in", /\\in(?![a-zA-Z])|\\notin|∈/g],
  ["\\subset", /\\subset|⊂|⊆/g],
  ["\\operatorname", /\\operatorname/g],
  ["\\Re", /\\Re(?![a-zA-Z])|\\(mathrm|text)\{Re\}/g],
  ["\\exp", /\\exp(?![a-zA-Z])/g],
  ["\\lceil", /\\lceil|⌈/g],
  ["\\lfloor", /\\lfloor|⌊/g],
  ["\\mid", /\\mid(?![a-zA-Z])/g],
  ["\\lVert", /\\lVert|\\\|/g],
  ["e^{i", /e\^\{[^}]*i/g],
];

function collector() {
  const fields: Field[] = [];
  const add = (path: string, text: string, formula = false) => {
    if (text.trim()) fields.push({ path, text, formula });
  };
  return { fields, add };
}

function chainFields(c: Chain): Field[] {
  const { fields, add } = collector();
  c.spans.forEach((s) => add(`spans[${s.id}].reason`, s.reason));
  c.reading.cues.forEach((q, i) => {
    add(`reading.cues[${i}].why_it_matters`, q.why_it_matters);
    add(`reading.cues[${i}].how_spotted`, q.how_spotted);
  });
  c.reading.definitions.forEach((d, i) =>
    add(`reading.definitions[${i}].meaning_latex`, d.meaning_latex, true)
  );
  Object.entries(c.goal).forEach(([key, text]) => add(`goal.${key}`, text));
  c.informal_cues.forEach((q, i) => add(`informal_cues[${i}].bearing`, q.bearing));
  c.abstraction.underneath.forEach((u, i) => {
    add(`abstraction.underneath[${i}].really_is`, u.really_is);
    add(`abstraction.underneath[${i}].implies`, u.implies);
  });
  c.abstraction.deeper_properties.forEach((d, i) => add(`abstraction.deeper_properties[${i}]`, d));
  Object.entries(c.simplification).forEach(([key, text]) =>
    add(`simplification.${key}`, text, key === "instance_latex")
  );
  c.method.candidates.forEach((m, i) => {
    add(`method.candidates[${i}].from_first_principles`, m.from_first_principles);
    add(`method.candidates[${i}].why`, m.why);
  });
  add("method.chosen", c.method.chosen);
  c.prerequisites.forEach((p, i) => add(`prerequisites[${i}].needed_for`, p.needed_for));
  c.second_reading.reweighted.forEach((r) => add(`second_reading.reweighted[${r.span_id}].why`, r.why));
  add("second_reading.what_changed", c.second_reading.what_changed);
  return fields;
}

// evidence_student is left out: it quotes the student's own notation.
function comparisonFields(c: Comparison): Field[] {
  const { fields, add } = collector();
  add("where_you_are", c.where_you_are);
  add("first_divergence", c.first_divergence);
  c.cards.forEach((card, i) => {
    add(`cards[${i}].diagnosis`, card.diagnosis);
    add(`cards[${i}].redirection`, card.redirection);
    add(`cards[${i}].self_check`, card.self_check);
  });
  add("where_to_next", c.where_to_next);
  return fields;
}

function measure(f: Field) {
  // Same test as FieldTex in components/reading/Tex.tsx.
  const bare = f.formula && !f.text.includes("$") && /[\\^_{}]/.test(f.text);
  const segments = bare ? [f.text] : (f.text.match(MATH) ?? []);
  const mathChars = segments.reduce((n, s) => n + s.length, 0);
  const words = bare ? 1 : f.text.replace(MATH, " x ").split(/\s+/).filter(Boolean).length;
  const heavy = HEAVY.flatMap(([name, re]) => (f.text.match(re) ?? []).map(() => name));
  const share = mathChars / f.text.length;
  // One heavy token weighs like a quarter of the field being notation.
  return { ...f, words, segments: segments.length, mathChars, heavy, share, score: share + heavy.length / 4 };
}

function report(title: string, fields: Field[]): void {
  const m = fields.map(measure);
  const sum = (get: (x: (typeof m)[number]) => number) => m.reduce((n, x) => n + get(x), 0);
  const chars = sum((x) => x.text.length);
  const counts = new Map<string, number>();
  for (const name of m.flatMap((x) => x.heavy)) counts.set(name, (counts.get(name) ?? 0) + 1);
  const reasons = m.filter((x) => x.path.startsWith("spans["));
  const dollarReasons = reasons.filter((x) => x.text.includes("$"));
  const pct = (x: number) => `${Math.round(x * 100)}%`;

  console.log(`--- plainness: ${title} ---`);
  console.log(`prose fields:   ${m.length}, avg ${(sum((x) => x.words) / Math.max(m.length, 1)).toFixed(1)} words`);
  console.log(`maths:          ${sum((x) => x.segments)} $…$ segments, ${pct(sum((x) => x.mathChars) / Math.max(chars, 1))} of characters`);
  console.log(
    `heavy notation: ${[...counts].map(([name, n]) => `${name} ×${n}`).join(", ") || "none"}`
  );
  if (reasons.length > 0) {
    const ids = dollarReasons.map((x) => x.path.slice(6, -8)).join(", ");
    console.log(`span reasons with $: ${dollarReasons.length} of ${reasons.length}${ids ? ` (${ids})` : ""}`);
  }
  const worst = m.filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 5);
  if (worst.length > 0) console.log("worst fields (maths share, heavy tokens):");
  for (const x of worst) {
    const text = x.text.replace(/\s+/g, " ");
    const preview = text.length > 90 ? `${text.slice(0, 87)}...` : text;
    console.log(`  ${pct(x.share).padStart(4)} ${x.heavy.length}h  ${x.path}: ${preview}`);
  }
}

export function printChainPlainness(title: string, chain: Chain): void {
  report(title, chainFields(chain));
}

export function printComparisonPlainness(title: string, comparison: Comparison): void {
  report(title, comparisonFields(comparison));
}

function pick(value: unknown, key: string): unknown {
  return typeof value === "object" && value !== null && key in value
    ? (value as Record<string, unknown>)[key]
    : undefined;
}

// Example files hold analysis.expert, dummies hold expert, --out writes a bare chain.
function main(): void {
  const arg = process.argv[2];
  if (!arg) {
    console.error("usage: npx tsx scripts/plainness.ts <analysis-or-chain.json | --examples>");
    process.exit(1);
  }
  if (arg === "--examples") {
    printChainPlainness("worked example, strategy (ICMC 2019 P1)", EXAMPLE);
    printChainPlainness("worked example, identity (ICMC 2019 P2)", EXAMPLE_IDENTITY);
    return;
  }
  const raw: unknown = JSON.parse(readFileSync(arg, "utf8"));
  const analysis = pick(raw, "analysis") ?? raw;
  printChainPlainness(`${arg}, expert chain`, ChainSchema.parse(pick(analysis, "expert") ?? analysis));
  const comparison = ComparisonSchema.safeParse(pick(analysis, "comparison"));
  if (comparison.success) printComparisonPlainness(`${arg}, feedback`, comparison.data);
}

if (require.main === module) main();
