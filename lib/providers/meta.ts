/* eslint-disable @typescript-eslint/no-unused-vars -- stub seam: params used once calls A/C are wired */
import type { Analysis, Chain } from "../schema";
import type { AnalysisInput } from "../analysis";

// Real pipeline (pending): call A expert pass, call C student extraction
// from photos, call B expert second reading, TS set-difference compare,
// call D behind Reveal. SDK: openai -> https://api.meta.ai/v1,
// model muse-spark-1.3, key MODEL_API_KEY. Browser never calls Meta directly.

export async function requestExpertPass(
  _problemText: string
): Promise<Chain["spans"]> {
  throw new Error("call A (expert pass) not wired yet");
}

export async function requestStudentExtraction(
  _problemText: string
): Promise<Chain["spans"]> {
  throw new Error("call C (student extraction) not wired yet");
}

export async function fetchMetaAnalysis(
  _input: AnalysisInput
): Promise<Analysis> {
  throw new Error("real model not wired yet (USE_MOCK=false with no provider)");
}
