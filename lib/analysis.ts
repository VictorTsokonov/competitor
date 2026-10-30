import type { Analysis } from "./schema";
import { fetchMockAnalysis } from "./providers/mock";
import { fetchMetaAnalysis } from "./providers/meta";

export type AnalysisInput = {
  problemText: string;
  studentMarks?: string;
};

export async function fetchAnalysis(input: AnalysisInput): Promise<Analysis> {
  if (process.env.USE_MOCK === "true") return fetchMockAnalysis(input);
  return fetchMetaAnalysis(input);
}
