import { AnalysisSchema, type Analysis } from "../schema";
import type { AnalysisInput } from "../analysis";
import { DUMMY_ANALYSES } from "../dummy";

export async function fetchMockAnalysis(
  input: AnalysisInput
): Promise<Analysis> {
  const dummy = input.problemId ? DUMMY_ANALYSES[input.problemId] : undefined;
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
