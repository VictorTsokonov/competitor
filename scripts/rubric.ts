import type { Chain } from "../lib/schema";

// Per-problem expectations for the bundled statements, so prompt tuning
// is a pass/fail report instead of eyeballing JSON. Patterns run over
// the relevant slice of the chain; "forbid" patterns over the whole
// chain catch answer leaks.

export type RubricCheck = { name: string; pass: boolean; detail: string };

type Rubric = {
  kept: { pattern: RegExp; why: string };
  dropped?: { pattern: RegExp; why: string };
  cues?: { pattern: RegExp; why: string };
  forbid?: { pattern: RegExp; why: string }[];
};

const RUBRICS: Record<string, Rubric> = {
  "icmc-2019-p1": {
    kept: {
      pattern: /monovariant|strictly decreas|more than half/i,
      why: "the kept method is the strict-decrease count argument",
    },
  },
  "icmc-2019-p2": {
    kept: {
      pattern: /i\\sqrt\{?3|real part|\\operatorname\{Re\}|complex|imaginary|non-real/i,
      why: "the kept method names the non-real substitution / real part",
    },
    dropped: {
      pattern: /sign/i,
      why: "some dropped candidate is refuted by the alternating signs",
    },
    cues: {
      pattern: /alternat|\(-1\)\^|\(-3\)\^|i\\sqrt|x\^2 ?= ?-3/i,
      why: "the reading cues carry the sign condition, not just 'square root'",
    },
    forbid: [
      { pattern: /2019/, why: "the answer's exponent 2019 must never appear in the reading" },
      { pattern: /a ?= ?-2|\(-2\)\^/, why: "the base -2 must never appear in the reading" },
    ],
  },
  "icmc-2020-p6": {
    kept: {
      pattern: /pigeonhole|dirichlet/i,
      why: "the kept method is pigeonhole / Dirichlet approximation",
    },
  },
};

// The fixtures/statements re-creation of P2 (with its "Problem 2." header,
// as a student pasting a screenshot produces it) is judged the same way.
RUBRICS["p2-recreated"] = RUBRICS["icmc-2019-p2"];

function keptText(chain: Chain): string {
  const kept = chain.method.candidates.filter((c) => c.kept);
  return [
    ...kept.map((c) => `${c.name} ${c.from_first_principles} ${c.why}`),
    chain.method.chosen,
  ].join(" ");
}

function droppedText(chain: Chain): string {
  return chain.method.candidates
    .filter((c) => !c.kept)
    .map((c) => `${c.name} ${c.from_first_principles} ${c.why}`)
    .join(" ");
}

function cuesText(chain: Chain): string {
  return [
    ...chain.spans.map((s) => s.reason),
    ...chain.reading.cues.map((c) => `${c.why_it_matters} ${c.how_spotted}`),
  ].join(" ");
}

// null = no rubric bundled for this id.
export function checkRubric(id: string, chain: Chain): RubricCheck[] | null {
  const rubric = RUBRICS[id] ?? RUBRICS[id.replace(/^seed-/, "")];
  if (!rubric) return null;
  const checks: RubricCheck[] = [];
  const probe = (
    name: string,
    text: string,
    rule: { pattern: RegExp; why: string },
    wantMatch: boolean
  ) =>
    checks.push({
      name,
      pass: rule.pattern.test(text) === wantMatch,
      detail: rule.why,
    });
  probe("kept method", keptText(chain), rubric.kept, true);
  if (rubric.dropped) probe("dropped candidate", droppedText(chain), rubric.dropped, true);
  if (rubric.cues) probe("reading cues", cuesText(chain), rubric.cues, true);
  const whole = JSON.stringify(chain);
  for (const f of rubric.forbid ?? []) probe("no leak", whole, f, false);
  return checks;
}
