import type {
  Analysis,
  AttemptReport,
  Chain,
  Comparison,
  Solution,
} from "./schema";
import type {
  AnalysisInput,
  AttemptInput,
  AttemptResult,
  ExpertStepInput,
  ExpertStepResult,
} from "./providers/types";
import { appMode, DemoModeError } from "./mode";
import { fetchDemoAnalysis } from "./providers/demo";
import { fetchMetaAnalysis, fetchMetaAttempt, runExpertStep } from "./providers/meta";
import { runSolve } from "./providers/meta/solve";
import { runExplain } from "./providers/meta/explain";
import { readPages } from "./providers/meta/vision";
import { runTitle } from "./providers/meta/title";

export type {
  AnalysisInput,
  AttemptInput,
  AttemptResult,
  ExpertStep,
  ExpertStepInput,
  ExpertStepResult,
} from "./providers/types";

// The provider seam every API route goes through. Demo mode serves the
// recorded examples and refuses everything that would need the model,
// whatever keys are set; live mode runs the Meta pipeline.
function refuseInDemo(): void {
  if (appMode() === "demo") throw new DemoModeError();
}

// Call S: the private solution that grounds the reading and the feedback.
export async function fetchSolution(problemText: string): Promise<Solution> {
  refuseInDemo();
  const text = problemText.trim();
  if (!text) throw new Error("The problem statement is empty: nothing to solve.");
  return (await runSolve(text)).solution;
}

export async function fetchAnalysis(input: AnalysisInput): Promise<Analysis> {
  if (appMode() === "demo") return fetchDemoAnalysis(input);
  return fetchMetaAnalysis(input);
}

// The expert reading one step per request (calls A, B and R), so the
// client can show and keep each step as it lands.
export async function fetchExpertStep(input: ExpertStepInput): Promise<ExpertStepResult> {
  refuseInDemo();
  return runExpertStep(input);
}

export async function fetchAttempt(input: AttemptInput): Promise<AttemptResult> {
  refuseInDemo();
  return fetchMetaAttempt(input);
}

// The explain call: the feedback pass over both chains.
export async function fetchExplanation(input: {
  problemText: string;
  problemId?: string;
  expert: Chain;
  student: Chain;
  report?: AttemptReport;
  solution?: Solution | null;
}): Promise<Comparison> {
  refuseInDemo();
  return (await runExplain(input)).data;
}

export async function fetchStatementText(pages: string[]): Promise<{ text: string }> {
  refuseInDemo();
  const { data } = await readPages({ purpose: "statement", pages });
  if (!data.text.trim()) {
    throw new Error("No readable problem statement was found in the image.");
  }
  return data;
}

// A short plain-text library name for a new problem.
export async function fetchTitle(problemText: string): Promise<string> {
  refuseInDemo();
  const text = problemText.trim();
  if (!text) throw new Error("The problem statement is empty: nothing to name.");
  return (await runTitle(text)).data.title;
}
