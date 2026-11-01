import type OpenAI from "openai";
import { z } from "zod";
import { AttemptReportSchema, type AttemptReport, type Chain } from "../../schema";
import { requestValidatedJson, type JsonCall } from "./client";
import { pinnedChainSchema } from "./chainSchema";
import { ATTEMPT_SYSTEM_PROMPT } from "./attemptPrompt";
import { STATEMENT_SYSTEM_PROMPT } from "./statementPrompt";

// The one image-reading entry point. Pages are JPEG data URLs prepared by
// lib/pages.ts in the browser; the purpose picks prompt and schema:
//   "statement" — transcribe a photographed problem into text + $…$ LaTeX
//   "attempt"   — call C: extract the student's reading as a Chain + report
// Server side only, same validate-and-retry path as call A.

export type StatementRead = { text: string };
export type StudentExtraction = { chain: Chain; report: AttemptReport };

const StatementReadSchema = z.object({ text: z.string() });

function studentExtractionSchema(problemText: string) {
  return z.object({
    chain: pinnedChainSchema(problemText, "student") as z.ZodType<Chain>,
    report: AttemptReportSchema,
  });
}

function pageContent(
  preamble: string | null,
  pages: string[]
): OpenAI.ChatCompletionContentPart[] {
  const parts: OpenAI.ChatCompletionContentPart[] = [];
  if (preamble) parts.push({ type: "text", text: preamble });
  pages.forEach((dataUrl, i) => {
    parts.push({ type: "text", text: `Page ${i + 1}:` });
    parts.push({ type: "image_url", image_url: { url: dataUrl } });
  });
  return parts;
}

export function readPages(opts: {
  purpose: "statement";
  pages: string[];
}): Promise<JsonCall<StatementRead>>;
export function readPages(opts: {
  purpose: "attempt";
  pages: string[];
  problemText: string;
}): Promise<JsonCall<StudentExtraction>>;
export async function readPages(opts: {
  purpose: "statement" | "attempt";
  pages: string[];
  problemText?: string;
}): Promise<JsonCall<StatementRead> | JsonCall<StudentExtraction>> {
  if (opts.pages.length === 0) {
    throw new Error("No pages to read: add at least one page first.");
  }
  if (opts.purpose === "statement") {
    return requestValidatedJson<StatementRead>({
      label: "statement read",
      system: STATEMENT_SYSTEM_PROMPT,
      user: pageContent(null, opts.pages),
      schema: StatementReadSchema,
      effort: "medium",
    });
  }
  const problemText = opts.problemText?.trim() ?? "";
  if (!problemText) {
    throw new Error("The attempt needs its problem statement text to read against.");
  }
  return requestValidatedJson<StudentExtraction>({
    label: "call C (student extraction)",
    system: ATTEMPT_SYSTEM_PROMPT,
    user: pageContent(`PROBLEM STATEMENT:\n${problemText}`, opts.pages),
    schema: studentExtractionSchema(problemText) as z.ZodType<StudentExtraction>,
    effort: "medium",
  });
}
