import { AnalysisSchema, type Analysis } from "../schema";
import type { AnalysisInput, AttemptInput, AttemptResult } from "./types";
import { DUMMY_ANALYSES } from "../dummy";

function bundledAnalysis(problemId: string | undefined): Analysis {
  const dummy = problemId ? DUMMY_ANALYSES[problemId] : undefined;
  if (!dummy) {
    throw new Error(
      "real model not wired yet for custom problems (mock serves the bundled ICMC demos only)"
    );
  }
  const parsed = AnalysisSchema.safeParse(dummy);
  if (!parsed.success) {
    const detail = parsed.error.issues.map((i) => i.message).join("; ");
    throw new Error(`mock data failed validation: ${detail}`);
  }
  return parsed.data;
}

export async function fetchMockAnalysis(
  input: AnalysisInput
): Promise<Analysis> {
  return bundledAnalysis(input.problemId);
}

// The dummies were written as guide-following students, so the mock
// attempt is their student chain with a clean structure report.
export async function fetchMockAttempt(
  input: AttemptInput
): Promise<AttemptResult> {
  const { student } = bundledAnalysis(input.problemId);
  return {
    student,
    report: {
      structure: "guided",
      inferred_stages: [],
      missing_stages: [],
      legibility: [],
    },
  };
}
