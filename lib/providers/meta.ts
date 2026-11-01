import { z } from "zod";
import {
  AnalysisSchema,
  ChainSchema,
  refineChainReferences,
  type Analysis,
  type Chain,
} from "../schema";
import type { AnalysisInput } from "./types";
import { requestValidatedJson, type JsonCall } from "./meta/client";
import { EXPERT_SYSTEM_PROMPT } from "./meta/expertPrompt";

// Call A (expert pass) is live; call C (student extraction) lives in
// ./meta/vision.ts; call B (second reading given A) is still pending, so
// the comparison stays the honest empty state.

export const NOT_MATHS_MESSAGE =
  "The model read this as not a well-posed maths problem, so there is no expert reading to build. Edit the statement and resubmit.";

// The model must echo problem.text verbatim; rather than fail on echo
// drift, pin it to the source so spans are validated against the real
// statement. Span ids referenced anywhere must exist. side "expert" also
// demands the 8-12 spans the prompt asks for; a student chain carries only
// what the pages evidence, so any count from 0 up is legal.
export function pinnedChainSchema(
  problemText: string,
  side: "expert" | "student"
) {
  return z.preprocess(
    (raw) =>
      typeof raw === "object" && raw !== null
        ? { ...(raw as Record<string, unknown>), problem: { text: problemText } }
        : raw,
    ChainSchema.superRefine((chain, ctx) => {
      refineChainReferences(chain, ctx);
      if (
        side === "expert" &&
        chain.domain === "maths" &&
        (chain.spans.length < 8 || chain.spans.length > 12)
      ) {
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
    schema: pinnedChainSchema(problemText, "expert") as z.ZodType<Chain>,
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
