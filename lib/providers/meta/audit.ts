import { z } from "zod";
import type { Chain, Solution } from "../../schema";
import { requestValidatedJson, type AttemptInfo } from "./client";
import { pinnedChainSchema } from "./chainSchema";
import { AUDIT_SYSTEM_PROMPT, REVISE_SYSTEM_PROMPT } from "./auditPrompt";

// Call R: audit the finished reading against the verified solution —
// true, faithful to the route, followable, no leak — and buy one
// targeted revision on a fail. Runs only when grounding exists, since
// faithfulness is only checkable against a verified route.

const AuditVerdictSchema = z.object({
  verdict: z.enum(["pass", "fail"]),
  notes: z.array(z.string()),
});

export type ChainAudit = {
  verdict: "pass" | "fail";
  notes: string[];
  revised: boolean;
};

export type AuditResult = {
  chain: Chain;
  audit: ChainAudit;
  attempts: AttemptInfo[];
};

function solutionBlock(solution: Solution): string {
  const { route, key_steps, final_line, small_case } = solution;
  return JSON.stringify({ route, key_steps, final_line, small_case });
}

export async function runChainAudit(
  problemText: string,
  chain: Chain,
  solution: Solution
): Promise<AuditResult> {
  const all: AttemptInfo[] = [];
  const check = await requestValidatedJson({
    label: "call R (audit)",
    system: AUDIT_SYSTEM_PROMPT,
    user:
      `PROBLEM STATEMENT:\n${problemText}\n\nVERIFIED SOLUTION:\n${solutionBlock(solution)}` +
      `\n\nREADING:\n${JSON.stringify(chain)}`,
    schema: AuditVerdictSchema,
    effort: "medium",
  });
  all.push(...check.attempts);
  if (check.data.verdict === "pass") {
    return { chain, audit: { ...check.data, revised: false }, attempts: all };
  }
  console.log(
    `[meta] call R failed the reading (${check.data.notes.length} note(s)); revising once`
  );
  const revised = await requestValidatedJson<Chain>({
    label: "call R (revise)",
    system: REVISE_SYSTEM_PROMPT,
    user:
      `PROBLEM STATEMENT:\n${problemText}\n\nVERIFIED SOLUTION:\n${solutionBlock(solution)}` +
      `\n\nREADING:\n${JSON.stringify(chain)}` +
      `\n\nAUDIT NOTES:\n${check.data.notes.map((n) => `- ${n}`).join("\n")}`,
    schema: pinnedChainSchema(problemText, "expert") as z.ZodType<Chain>,
    effort: "medium",
  });
  all.push(...revised.attempts);
  return {
    chain: revised.data,
    audit: { ...check.data, revised: true },
    attempts: all,
  };
}
