import { AnalysisSchema, type Analysis, type Solution } from "../lib/schema";

// A recorded example is public: call S's solution must never be written.
// stripSolution drops it (keeping only whether the reading was grounded)
// and then fails loudly if any of it survives — as a key of the
// solution's shape anywhere, or as solution text copied verbatim into any
// field. The route and the small-case instance are exempt from the text
// check: a grounded reading names its route and uses that instance as its
// simplification by design. The answer, the steps and the worked case are
// what must never appear.

const SOLUTION_KEYS = new Set([
  "solution",
  "key_steps",
  "final_line",
  "small_case",
  "verification_notes",
]);

// Shorter fragments ("$n=1$") match by coincidence, not by leaking.
const MIN_FRAGMENT = 12;

function normalise(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function walk(value: unknown, path: string, keys: string[], strings: string[]): void {
  if (typeof value === "string") {
    strings.push(value);
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => walk(v, `${path}[${i}]`, keys, strings));
  } else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      if (SOLUTION_KEYS.has(k)) keys.push(`${path}.${k}`);
      walk(v, `${path}.${k}`, keys, strings);
    }
  }
}

export function assertNoSolution(value: unknown, solution: Solution | null): void {
  const keys: string[] = [];
  const strings: string[] = [];
  walk(value, "example", keys, strings);
  const haystack = normalise(strings.join("\n"));
  const privateText = solution
    ? [
        solution.final_line,
        ...solution.key_steps,
        solution.small_case.worked,
        solution.small_case.confirms,
      ]
    : [];
  const copied = privateText
    .map(normalise)
    .filter((t) => t.length >= MIN_FRAGMENT && haystack.includes(t));
  const problems = [
    ...keys.map((k) => `solution field survived at ${k}`),
    ...copied.map((t) => `solution text copied verbatim: "${t.slice(0, 80)}"`),
  ];
  if (problems.length > 0) {
    throw new Error(`refusing to write the example:\n  - ${problems.join("\n  - ")}`);
  }
}

export function stripSolution(analysis: Analysis, solution: Solution | null): Analysis {
  const copy: Analysis = { ...analysis, grounded: solution?.verified === true };
  delete copy.solution;
  const stripped = AnalysisSchema.parse(copy);
  assertNoSolution(stripped, solution);
  return stripped;
}
