import type { z } from "zod";
import { AnalysisSchema, type Analysis, type Chain } from "../schema";
import type { AnalysisInput, AttemptInput, AttemptResult } from "./types";
import { requestValidatedJson, type JsonCall } from "./meta/client";
import { pinnedChainSchema } from "./meta/chainSchema";
import { readPages } from "./meta/vision";
import { EXPERT_SYSTEM_PROMPT } from "./meta/expertPrompt";

// Call A (expert pass) and call C (student extraction, via ./meta/vision)
// are live; call B (second reading given A) is still pending, so the
// comparison stays the honest empty state.

export const NOT_MATHS_MESSAGE =
  "The model read this as not a well-posed maths problem, so there is no expert reading to build. Edit the statement and resubmit.";

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

// Call C: the student's reading extracted from attempt pages, plus the
// structure report. A not_maths verdict here means the pages were not a
// maths attempt at all; a nearly empty attempt still comes back "maths".
export async function fetchMetaAttempt(input: AttemptInput): Promise<AttemptResult> {
  const text = input.problemText.trim();
  if (!text) throw new Error("The problem statement is empty: nothing to read against.");
  const { data } = await readPages({
    purpose: "attempt",
    pages: input.pages,
    problemText: text,
  });
  if (data.chain.domain === "not_maths") {
    throw new Error(
      "The model could not read these pages as a maths attempt. Check the photos show your working and resubmit."
    );
  }
  return { student: data.chain, report: data.report };
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
