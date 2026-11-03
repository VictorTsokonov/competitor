import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/apiError";
import { z } from "zod";
import { fetchExpertStep } from "@/lib/analysis";
import { ChainSchema, SolutionSchema } from "@/lib/schema";

// One step of the expert reading per request: "first" is call A,
// "second" re-reads the client-held chain (call B), "audit" checks it
// against a verified solution (call R). Splitting them lets the client
// show and keep each step instead of waiting minutes on one request.
const BodySchema = z
  .object({
    step: z.enum(["first", "second", "audit"]),
    problemText: z.string().trim().min(1, "the problem statement is empty"),
    problemId: z.string().optional(),
    chain: ChainSchema.optional(),
    solution: SolutionSchema.nullish(),
  })
  .superRefine((b, ctx) => {
    if (b.step === "first") return;
    if (!b.chain) {
      ctx.addIssue({
        code: "custom",
        message: `the ${b.step} step needs the chain from the step before it`,
        path: ["chain"],
      });
    } else if (b.chain.problem.text !== b.problemText) {
      ctx.addIssue({
        code: "custom",
        message: "the chain was read from a different problem statement",
        path: ["chain", "problem", "text"],
      });
    }
    if (b.step === "audit" && b.solution?.verified !== true) {
      ctx.addIssue({
        code: "custom",
        message: "the audit step needs a verified solution",
        path: ["solution"],
      });
    }
  });

export async function POST(req: Request) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const detail = !issue
      ? "invalid request"
      : issue.path.length > 0
        ? `${issue.path.join(".")}: ${issue.message}`
        : issue.message;
    return NextResponse.json({ error: detail }, { status: 400 });
  }
  try {
    return NextResponse.json(await fetchExpertStep(parsed.data));
  } catch (e: unknown) {
    return errorResponse(e);
  }
}
