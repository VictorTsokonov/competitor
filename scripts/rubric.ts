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
      // "more than half" alone is not the argument: a bare majority of
      // 2n+1 leaves n, so the count only stops growing.
      pattern: /monovariant|strictly decreas|(falls|goes down|decreases) every round/i,
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
      // Symbol forms, and the same condition in the plain style's words
      // ("the sign flips", "multiplies by minus 3", "here $-3$").
      pattern:
        /alternat|\(-1\)\^|\(-3\)\^|i\\sqrt|x\^2 ?= ?-3|sign (flips|changes)|flipping sign|(minus|negative) (3|three)\b|\$-3\$/i,
      why: "the reading cues carry the sign condition, not just 'square root'",
    },
    forbid: [
      { pattern: /2019/, why: "the answer's exponent 2019 must never appear in the reading" },
      // The chain is checked as JSON, so a LaTeX backslash shows doubled;
      // [-−] takes the ASCII and the Unicode minus (the fixture uses both).
      {
        pattern: /\(\s*[-−]\s*2\s*(\\+right)?\)\s*\^/,
        why: "the base -2 must never appear in the reading (\"(-2)^\", \"\\left(-2\\right)^\")",
      },
      {
        pattern: /\b(base|a)\$?( \$?a\$?)?\s*(=|is|equals)\s*\$?\s*(\\+left\()?\s*(minus |negative |[-−])\s*(two|2)\b/i,
        why: "the base -2 must never appear in the reading (\"$a = -2$\", \"the base $a$ is minus two\")",
      },
      // The plain style writes maths in words, and so can a leak. These
      // catch -2 as a base or 2019 spelled out, never small-case
      // arithmetic such as "1 - 3 = -2".
      {
        pattern: /powers? of (minus|negative|[-−]) ?(two|2)\b/i,
        why: "the base -2 must not appear in words either (\"a power of minus two\")",
      },
      {
        pattern: /\b(minus|negative) (two|2) (to the|to an? |raised|squared|cubed)|[-−]2 (to the|raised)/i,
        why: "the base -2 must not appear in words either (\"negative two to the ...\", \"minus 2 raised ...\")",
      },
      {
        pattern: /\bbase (of |is |equal to )?(minus |negative |[-−])(two|2)\b|(minus|negative|[-−]) ?(two|2) as (the|its|a) base/i,
        why: "the base -2 must not appear in words either (\"the base is minus two\")",
      },
      { pattern: /two thousand (and )?nineteen/i, why: "the exponent 2019 must not appear in words either" },
      {
        pattern: /one (less|fewer) than 2020|\b2020 ?[-−] ?1\b/i,
        why: "the exponent 2019 must not appear as \"one less than 2020\" either",
      },
      // The value itself: the real part worked out as a cosine, a half or
      // the final angle of 240 degrees.
      {
        pattern: /2\^\{?2020\}?[^.]{0,40}(cos|half)|(half|\\+t?frac\{?1\}?\{?2\}?)[^.]{0,30}2\^\{?2020|\b240\s*(degrees|\^\{?\\+circ|°)/i,
        why: "the sum's value must not appear (2^2020 with a cosine or a half, or the 240-degree final turn)",
      },
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
  const rubric = RUBRICS[id];
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
