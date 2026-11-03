import type { Analysis } from "../schema";
import type { AnalysisInput } from "./types";
import { DemoModeError } from "../mode";
import { loadExampleById } from "../demoExamples";

// Demo mode's only provider: the recorded real runs in lib/examples/,
// served by library id ("example-1"). Anything else is refused, never
// sent to the model.
export async function fetchDemoAnalysis(input: AnalysisInput): Promise<Analysis> {
  const example = input.problemId ? await loadExampleById(input.problemId) : null;
  if (!example) throw new DemoModeError();
  return example.analysis;
}
