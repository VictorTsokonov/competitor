import { z } from "zod";
import { AnalysisSchema, ChainSchema, type Analysis, type Chain } from "../schema";
import type { AnalysisInput } from "./types";
import { requestValidatedJson, type JsonCall } from "./meta/client";
import { EXPERT_SYSTEM_PROMPT } from "./meta/expertPrompt";

// Call A (expert pass) is live; call C (student extraction) and call B
// (second reading given A) are still pending, so the student chain is an
// empty placeholder and the comparison is the honest empty state.

export const NOT_MATHS_MESSAGE =
  "The model read this as not a well-posed maths problem, so there is no expert reading to build. Edit the statement and resubmit.";

// The model must echo problem.text verbatim; rather than fail on echo
// drift, pin it to the source so spans are validated against the real
// statement. Extra checks: span ids referenced anywhere must exist, and
// a maths reading carries 8-12 spans as the prompt demands.
function expertChainSchema(problemText: string) {
  return z.preprocess(
    (raw) =>
      typeof raw === "object" && raw !== null
        ? { ...(raw as Record<string, unknown>), problem: { text: problemText } }
        : raw,
    ChainSchema.superRefine((chain, ctx) => {
      const ids = new Set(chain.spans.map((s) => s.id));
      const check = (id: string, path: (string | number)[]) => {
        if (!ids.has(id)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `references unknown span id "${id}"`,
            path,
          });
        }
      };
      chain.reading.cues.forEach((c, i) =>
        check(c.span_id, ["reading", "cues", i, "span_id"])
      );
      chain.informal_cues.forEach((c, i) =>
        check(c.span_id, ["informal_cues", i, "span_id"])
      );
      chain.method.candidates.forEach((c, i) =>
        c.deciding_span_ids.forEach((id, j) =>
          check(id, ["method", "candidates", i, "deciding_span_ids", j])
        )
      );
      chain.second_reading.reweighted.forEach((r, i) =>
        check(r.span_id, ["second_reading", "reweighted", i, "span_id"])
      );
      if (chain.domain === "maths" && (chain.spans.length < 8 || chain.spans.length > 12)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `a maths reading needs 8-12 spans, got ${chain.spans.length}`,
          path: ["spans"],
        });
      }
    })
  );
}

// Call A with full attempt info, for the tuning script. Throws a readable
// message when the input is not a maths problem.
export async function runExpertPass(problemText: string): Promise<JsonCall<Chain>> {
  const result = await requestValidatedJson<Chain>({
    label: "call A (expert pass)",
    system: EXPERT_SYSTEM_PROMPT,
    user: problemText,
    schema: expertChainSchema(problemText) as z.ZodType<Chain>,
    effort: "high",
  });
  if (result.data.domain === "not_maths") throw new Error(NOT_MATHS_MESSAGE);
  return result;
}

export async function requestExpertPass(problemText: string): Promise<Chain> {
  return (await runExpertPass(problemText)).data;
}

export async function requestStudentExtraction(
  _problemText: string // eslint-disable-line @typescript-eslint/no-unused-vars -- stub until call C
): Promise<Chain["spans"]> {
  throw new Error("call C (student extraction) not wired yet");
}

// All stages empty: the UI renders expert highlights with no underlines
// and the comparison panel keeps its empty state until call C lands.
function emptyStudentChain(problemText: string): Chain {
  return {
    problem: { text: problemText },
    spans: [],
    reading: { cues: [], definitions: [] },
    goal: { asked: "", answer_form: "", final_line_would_say: "" },
    informal_cues: [],
    abstraction: { underneath: [], deeper_properties: [] },
    simplification: { instance: "", instance_latex: "", what_to_try: "", notice_prompt: "" },
    method: { candidates: [], chosen: "" },
    prerequisites: [],
    second_reading: { new_spans: [], reweighted: [], what_changed: "" },
    domain: "maths",
  };
}

export async function fetchMetaAnalysis(input: AnalysisInput): Promise<Analysis> {
  const text = input.problemText.trim();
  if (!text) throw new Error("The problem statement is empty: nothing to analyse.");
  const expert = await requestExpertPass(text);
  return AnalysisSchema.parse({
    problem: { text },
    expert,
    student: emptyStudentChain(text),
    // No compare.ts yet; honest placeholder until call C provides a student chain.
    comparison: {
      first_divergence: "Submit your attempt to see the comparison.",
      missed_cues: [],
      unused_cues: [],
    },
  });
}
