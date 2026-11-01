import { z } from "zod";
import { SolutionSchema, type Solution } from "../../schema";
import { requestValidatedJson, type AttemptInfo } from "./client";
import { SOLVE_SYSTEM_PROMPT, VERIFY_SYSTEM_PROMPT } from "./solvePrompt";

// Call S: solve privately (high effort), then have a sceptical second
// pass recompute the small case and walk the steps (medium). A failed
// verdict buys one corrected solve; the final verdict lands in
// solution.verified either way — the UI words its honesty note from it.

const DraftSchema = SolutionSchema.omit({ verified: true, verification_notes: true });
type Draft = z.infer<typeof DraftSchema>;

const VerdictSchema = z.object({
  verdict: z.enum(["pass", "fail"]),
  notes: z.array(z.string()),
});

export type SolveResult = {
  solution: Solution;
  attempts: AttemptInfo[];
};

async function solveOnce(
  problemText: string,
  feedback: { previous: Draft; notes: string[] } | null
): Promise<{ draft: Draft; attempts: AttemptInfo[] }> {
  const user = feedback
    ? `${problemText}\n\nYOUR PREVIOUS SOLUTION FAILED VERIFICATION.\nPrevious solution:\n${JSON.stringify(
        feedback.previous
      )}\nVerifier's findings:\n${feedback.notes.map((n) => `- ${n}`).join("\n")}\n\nProduce a corrected, complete solution from scratch. Do not repeat the refuted step.`
    : problemText;
  const { data, attempts } = await requestValidatedJson<Draft>({
    label: feedback ? "call S (re-solve)" : "call S (solve)",
    system: SOLVE_SYSTEM_PROMPT,
    user,
    schema: DraftSchema as z.ZodType<Draft>,
    effort: "high",
  });
  return { draft: data, attempts };
}

async function verify(
  problemText: string,
  draft: Draft
): Promise<{ verdict: "pass" | "fail"; notes: string[]; attempts: AttemptInfo[] }> {
  const { data, attempts } = await requestValidatedJson({
    label: "call S (verify)",
    system: VERIFY_SYSTEM_PROMPT,
    user: `PROBLEM:\n${problemText}\n\nPROPOSED SOLUTION:\n${JSON.stringify(draft, null, 1)}`,
    schema: VerdictSchema,
    effort: "medium",
  });
  return { ...data, attempts };
}

export async function runSolve(problemText: string): Promise<SolveResult> {
  const all: AttemptInfo[] = [];
  const first = await solveOnce(problemText, null);
  all.push(...first.attempts);
  let draft = first.draft;
  if (!draft.route) {
    throw new Error(
      "The model read this as not a well-posed maths problem, so there is nothing to solve. Edit the statement and resubmit."
    );
  }
  let check = await verify(problemText, draft);
  all.push(...check.attempts);
  if (check.verdict === "fail") {
    console.log(
      `[meta] call S failed verification (${check.notes.length} note(s)); re-solving once`
    );
    const second = await solveOnce(problemText, { previous: draft, notes: check.notes });
    all.push(...second.attempts);
    draft = second.draft;
    check = await verify(problemText, draft);
    all.push(...check.attempts);
  }
  return {
    solution: { ...draft, verified: check.verdict === "pass", verification_notes: check.notes },
    attempts: all,
  };
}
