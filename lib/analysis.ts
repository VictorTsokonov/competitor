import type { Analysis } from "./schema";
import type { AnalysisInput, AttemptInput, AttemptResult } from "./providers/types";
import { fetchMockAnalysis, fetchMockAttempt } from "./providers/mock";
import { fetchMetaAnalysis, fetchMetaAttempt } from "./providers/meta";
import { readPages } from "./providers/meta/vision";

export type { AnalysisInput, AttemptInput, AttemptResult } from "./providers/types";

export async function fetchAnalysis(input: AnalysisInput): Promise<Analysis> {
  if (process.env.USE_MOCK === "true") return fetchMockAnalysis(input);
  return fetchMetaAnalysis(input);
}

export async function fetchAttempt(input: AttemptInput): Promise<AttemptResult> {
  if (process.env.USE_MOCK === "true") return fetchMockAttempt(input);
  return fetchMetaAttempt(input);
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
