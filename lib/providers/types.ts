import type { Analysis, AttemptReport, Chain, Solution } from "../schema";

// Shared provider input, defined here so providers never import from
// lib/analysis.ts (which imports the providers back).
export type AnalysisInput = {
  problemText: string;
  // Set for problems from the library; lets the mock serve bundled analyses.
  problemId?: string;
  studentMarks?: string;
  // Call S's result, when the client already holds it; grounds call A/B.
  solution?: Solution | null;
};

// Call C input: the statement the spans must quote, and the attempt pages
// as JPEG data URLs in reading order (prepared client-side by lib/pages.ts).
export type AttemptInput = {
  problemText: string;
  pages: string[];
  problemId?: string;
};

export type AttemptResult = {
  student: Chain;
  report: AttemptReport;
};

// The expert reading as three separate requests (POST /api/expert), so
// the client can show and keep each one: "first" is call A, "second" is
// call B over that chain, "audit" is call R against a verified solution.
export type ExpertStep = "first" | "second" | "audit";

export type ExpertStepInput = {
  step: ExpertStep;
  problemText: string;
  problemId?: string;
  // The chain the step works on; required for "second" and "audit".
  chain?: Chain;
  solution?: Solution | null;
};

// The analysis wraps the chain as it stands after this step; audit is
// set only for the "audit" step.
export type ExpertStepResult = {
  analysis: Analysis;
  audit?: { verdict: "pass" | "fail"; revised: boolean };
};
