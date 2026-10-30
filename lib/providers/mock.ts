import { AnalysisSchema, type Analysis } from "../schema";
import type { AnalysisInput } from "../analysis";
import dummyData from "../dummy-data.json";

export async function fetchMockAnalysis(
  input: AnalysisInput
): Promise<Analysis> {
  if (input.problemText.trim()) {
    throw new Error(
      "real model not wired yet for custom problems (mock serves the ICMC demo only)"
    );
  }
  const parsed = AnalysisSchema.safeParse(dummyData);
  if (!parsed.success) {
    const detail = parsed.error.issues.map((i) => i.message).join("; ");
    throw new Error(`mock data failed validation: ${detail}`);
  }
  return parsed.data;
}
