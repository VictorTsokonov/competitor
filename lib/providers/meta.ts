import type { z } from "zod";
import { AnalysisSchema, type Analysis, type Chain, type Solution } from "../schema";
import type {
  AnalysisInput,
  AttemptInput,
  AttemptResult,
  ExpertStepInput,
  ExpertStepResult,
} from "./types";
import { requestValidatedJson, type JsonCall } from "./meta/client";
import { pinnedChainSchema } from "./meta/chainSchema";
import { readPages } from "./meta/vision";
import { EXPERT_SYSTEM_PROMPT } from "./meta/expertPrompt";
import { REWEIGH_SYSTEM_PROMPT } from "./meta/reweighPrompt";
import { runChainAudit } from "./meta/audit";

// Call A (expert pass, grounded in call S's verified solution when one is
// supplied), call B (second reading, ./meta/reweighPrompt) and call C
// (student extraction, ./meta/vision) are live. The expert reading runs
// either in one go (fetchMetaAnalysis, for the scripts and /api/analyse)
// or one step per request (runExpertStep, for /api/expert).

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
  let chain = first;
  try {
    chain = (await runSecondReading(problemText, first, solution)).data;
  } catch (e: unknown) {
    // The second reading refines; its failure must never cost the reading.
    console.log(
      `[meta] call B failed (${e instanceof Error ? e.message : "error"}); keeping the first reading`
    );
  }
  // Call R: audit the chain against the verified route (true, faithful,
  // followable, no leak), with one revision on a fail. Like call B, its
  // own failure never costs the reading.
  if (solution?.verified) {
    try {
      chain = (await runChainAudit(problemText, chain, solution)).chain;
    } catch (e: unknown) {
      console.log(
        `[meta] call R failed (${e instanceof Error ? e.message : "error"}); keeping the unaudited reading`
      );
    }
  }
  return chain;
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

// An expert chain as a full Analysis: the student side empty and an
// honest placeholder comparison until call C provides a student chain.
// problemText must already be trimmed, as the chain's spans quote it.
export function analysisFromExpertChain(
  problemText: string,
  expert: Chain,
  solution?: Solution | null
): Analysis {
  return AnalysisSchema.parse({
    problem: { text: problemText },
    expert,
    student: emptyStudentChain(problemText),
    comparison: {
      where_you_are: "",
      first_divergence: "Submit your attempt to see the comparison.",
      cards: [],
      unused_cues: [],
      where_to_next: "",
    },
    solution: solution ?? undefined,
  });
}

export async function fetchMetaAnalysis(input: AnalysisInput): Promise<Analysis> {
  const text = input.problemText.trim();
  if (!text) throw new Error("The problem statement is empty: nothing to analyse.");
  const expert = await requestExpertPass(text, input.solution);
  return analysisFromExpertChain(text, expert, input.solution);
}

// One step of the expert reading per request. Unlike requestExpertPass,
// a failing call B or R throws here: the client decides that those two
// are non-fatal and keeps the chain it already holds.
export async function runExpertStep(input: ExpertStepInput): Promise<ExpertStepResult> {
  const text = input.problemText.trim();
  if (!text) throw new Error("The problem statement is empty: nothing to analyse.");
  const solution = input.solution ?? null;
  if (input.step === "first") {
    const chain = (await runExpertPass(text, solution)).data;
    return { analysis: analysisFromExpertChain(text, chain, solution) };
  }
  const chain = input.chain;
  if (!chain) {
    throw new Error(`The ${input.step} step needs the reading from the step before it.`);
  }
  if (input.step === "second") {
    const updated = (await runSecondReading(text, chain, solution)).data;
    return { analysis: analysisFromExpertChain(text, updated, solution) };
  }
  if (!solution?.verified) {
    throw new Error("The audit needs a verified solution to check the reading against.");
  }
  const { chain: audited, audit } = await runChainAudit(text, chain, solution);
  return {
    analysis: analysisFromExpertChain(text, audited, solution),
    audit: { verdict: audit.verdict, revised: audit.revised },
  };
}
