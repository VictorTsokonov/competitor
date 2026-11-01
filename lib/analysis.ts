import type {
  Analysis,
  AttemptReport,
  Chain,
  Comparison,
  Solution,
} from "./schema";
import type { AnalysisInput, AttemptInput, AttemptResult } from "./providers/types";
import { fetchMockAnalysis, fetchMockAttempt, fetchMockComparison } from "./providers/mock";
import { fetchMetaAnalysis, fetchMetaAttempt } from "./providers/meta";
import { runSolve } from "./providers/meta/solve";
import { runExplain } from "./providers/meta/explain";
import { readPages } from "./providers/meta/vision";

export type { AnalysisInput, AttemptInput, AttemptResult } from "./providers/types";

// Call S. Mock mode has no solver: null tells the client to proceed
// ungrounded (the dummies carry their own hand-written quality target).
export async function fetchSolution(problemText: string): Promise<Solution | null> {
  if (process.env.USE_MOCK === "true") return null;
  const text = problemText.trim();
  if (!text) throw new Error("The problem statement is empty: nothing to solve.");
  return (await runSolve(text)).solution;
}

export async function fetchAnalysis(input: AnalysisInput): Promise<Analysis> {
  if (process.env.USE_MOCK === "true") return fetchMockAnalysis(input);
  return fetchMetaAnalysis(input);
}

export async function fetchAttempt(input: AttemptInput): Promise<AttemptResult> {
  if (process.env.USE_MOCK === "true") return fetchMockAttempt(input);
  return fetchMetaAttempt(input);
}

// The explain call. Mock mode serves the bundled hand-written comparison.
export async function fetchExplanation(input: {
  problemText: string;
  problemId?: string;
  expert: Chain;
  student: Chain;
  report?: AttemptReport;
  solution?: Solution | null;
}): Promise<Comparison> {
  if (process.env.USE_MOCK === "true") return fetchMockComparison(input.problemId);
  return (await runExplain(input)).data;
}

export async function fetchStatementText(pages: string[]): Promise<{ text: string }> {
  if (process.env.USE_MOCK === "true") {
    throw new Error(
      "statement transcription is not wired in mock mode (USE_MOCK=true) — type the statement instead"
    );
  }
  const { data } = await readPages({ purpose: "statement", pages });
  if (!data.text.trim()) {
    throw new Error("No readable problem statement was found in the image.");
  }
  return data;
}
