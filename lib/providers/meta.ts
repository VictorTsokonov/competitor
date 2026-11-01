import type { z } from "zod";
import { AnalysisSchema, type Analysis, type Chain, type Solution } from "../schema";
import type { AnalysisInput, AttemptInput, AttemptResult } from "./types";
import { requestValidatedJson, type JsonCall } from "./meta/client";
import { pinnedChainSchema } from "./meta/chainSchema";
import { readPages } from "./meta/vision";
import { EXPERT_SYSTEM_PROMPT } from "./meta/expertPrompt";
import { REWEIGH_SYSTEM_PROMPT } from "./meta/reweighPrompt";

// Call A (expert pass, grounded in call S's verified solution when one is
// supplied), call B (second reading, ./meta/reweighPrompt) and call C
// (student extraction, ./meta/vision) are live.

export const NOT_MATHS_MESSAGE =
  "The model read this as not a well-posed maths problem, so there is no expert reading to build. Edit the statement and resubmit.";

// The solution is grounding only while it survived verification; a failed
// draft would steer the reading wrong, so it is dropped silently and the
// UI keeps its humbler plausible-narrative note.
function groundingBlock(solution: Solution | null | undefined): string {
  if (!solution || !solution.verified) return "";
  const { route, key_steps, final_line, small_case } = solution;
  return (
    "\n\nVERIFIED SOLUTION (private grounding — never echo it, never state its final answer in any field):\n" +
    JSON.stringify({ route, key_steps, final_line, small_case })
  );
}

// Call A with full attempt info, for the tuning script. Throws a readable
// message when the input is not a maths problem.
export async function runExpertPass(
  problemText: string,
  solution?: Solution | null
): Promise<JsonCall<Chain>> {
  const result = await requestValidatedJson<Chain>({
    label: "call A (expert pass)",
    system: EXPERT_SYSTEM_PROMPT,
    user: problemText + groundingBlock(solution),
    schema: pinnedChainSchema(problemText, "expert") as z.ZodType<Chain>,
    effort: "high",
  });
  if (result.data.domain === "not_maths") throw new Error(NOT_MATHS_MESSAGE);
  return result;
}

// Call B: the expert re-reads with the finished chain (and solution) in
// hand and returns the complete updated chain — weights move, up to two
// spans join, second_reading records the pass.
export async function runSecondReading(
  problemText: string,
  chain: Chain,
  solution?: Solution | null
): Promise<JsonCall<Chain>> {
  return requestValidatedJson<Chain>({
    label: "call B (second reading)",
    system: REWEIGH_SYSTEM_PROMPT,
    user:
      `PROBLEM STATEMENT:\n${problemText}\n\nFIRST READING:\n${JSON.stringify(chain)}` +
      groundingBlock(solution),
    schema: pinnedChainSchema(problemText, "expert") as z.ZodType<Chain>,
    effort: "medium",
  });
}

export async function requestExpertPass(
  problemText: string,
  solution?: Solution | null
): Promise<Chain> {
  const first = (await runExpertPass(problemText, solution)).data;
  try {
    return (await runSecondReading(problemText, first, solution)).data;
  } catch (e: unknown) {
    // The second reading refines; its failure must never cost the reading.
    console.log(
      `[meta] call B failed (${e instanceof Error ? e.message : "error"}); keeping the first reading`
    );
    return first;
  }
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
  const expert = await requestExpertPass(text, input.solution);
  return AnalysisSchema.parse({
    problem: { text },
    expert,
    student: emptyStudentChain(text),
    // Honest placeholder until call C provides a student chain.
    comparison: {
      where_you_are: "",
      first_divergence: "Submit your attempt to see the comparison.",
      cards: [],
      unused_cues: [],
      where_to_next: "",
    },
    solution: input.solution ?? undefined,
  });
}
