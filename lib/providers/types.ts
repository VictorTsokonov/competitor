import type { AttemptReport, Chain } from "../schema";

// Shared provider input, defined here so providers never import from
// lib/analysis.ts (which imports the providers back).
export type AnalysisInput = {
  problemText: string;
  // Set for problems from the library; lets the mock serve bundled analyses.
  problemId?: string;
  studentMarks?: string;
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
