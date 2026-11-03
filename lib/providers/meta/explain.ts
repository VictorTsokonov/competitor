import { z } from "zod";
import {
  ComparisonSchema,
  type AttemptReport,
  type Chain,
  type Comparison,
  type Solution,
} from "../../schema";
import { compareSkeleton } from "../../compare";
import { requestValidatedJson, type JsonCall } from "./client";
import { repairDollarsDeep } from "./dollars";
import { EXPLAIN_SYSTEM_PROMPT } from "./explainPrompt";

// The explain call: turns the computed comparison skeleton into
// elaborated feedback, grounded in the verified solution when there is
// one. lib/compare.ts remains the fallback if this call fails. A dropped
// closing $ in the prose is repaired (./dollars.ts); unused_cues copy
// statement phrases verbatim and are left alone.

function explainSchema(expert: Chain) {
  const ids = new Set(expert.spans.map((s) => s.id));
  const checked = ComparisonSchema.superRefine((c, ctx) => {
    c.cards.forEach((card, i) =>
      card.expert_span_ids.forEach((id, j) => {
        if (!ids.has(id)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `references unknown expert span id "${id}"`,
            path: ["cards", i, "expert_span_ids", j],
          });
        }
      })
    );
  });
  return z.preprocess(
    (raw) => repairDollarsDeep(raw, (path) => path[0] === "unused_cues"),
    checked
  );
}

export async function runExplain(input: {
  problemText: string;
  expert: Chain;
  student: Chain;
  report?: AttemptReport;
  solution?: Solution | null;
}): Promise<JsonCall<Comparison>> {
  const { problemText, expert, student, report, solution } = input;
  const grounded = solution && solution.verified ? solution : null;
  const blocks = [
    `PROBLEM STATEMENT:\n${problemText}`,
    grounded
      ? `VERIFIED SOLUTION (private — never echo its final answer or derivation):\n${JSON.stringify(
          {
            route: grounded.route,
            key_steps: grounded.key_steps,
            final_line: grounded.final_line,
            small_case: grounded.small_case,
          }
        )}`
      : `VERIFIED SOLUTION: none available — ground the feedback in the expert chain only, and keep claims correspondingly modest.`,
    `EXPERT CHAIN:\n${JSON.stringify(expert)}`,
    `STUDENT CHAIN:\n${JSON.stringify(student)}`,
    `STUDENT STRUCTURE REPORT:\n${JSON.stringify(report ?? null)}`,
    `COMPUTED FACTS (authoritative):\n${JSON.stringify(compareSkeleton(expert, student))}`,
  ];
  return requestValidatedJson<Comparison>({
    label: "explain call (feedback)",
    system: EXPLAIN_SYSTEM_PROMPT,
    user: blocks.join("\n\n"),
    schema: explainSchema(expert) as z.ZodType<Comparison>,
    // high: judging what the student's own working already does is the
    // hard part of this call; at medium it repeatedly contradicted correct
    // lines on the pages (3 of 4 recorded runs, 3 Nov).
    effort: "high",
  });
}
