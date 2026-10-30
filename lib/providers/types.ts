// Shared provider input, defined here so providers never import from
// lib/analysis.ts (which imports the providers back).
export type AnalysisInput = {
  problemText: string;
  // Set for problems from the library; lets the mock serve bundled analyses.
  problemId?: string;
  studentMarks?: string;
};
