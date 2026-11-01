import { NextResponse } from "next/server";
import { z } from "zod";
import { fetchExplanation } from "@/lib/analysis";
import {
  AttemptReportSchema,
  ChainSchema,
  SolutionSchema,
} from "@/lib/schema";

// The explain call: client-held chains come back for the feedback pass.
// Shapes are validated at the boundary; the expert chain's spans are
// substring-checked against its own problem text by ChainSchema.
const BodySchema = z.object({
  problemText: z.string().min(1),
  problemId: z.string().optional(),
  expert: ChainSchema,
  student: ChainSchema,
  report: AttemptReportSchema.optional(),
  solution: SolutionSchema.nullish(),
});

export async function POST(req: Request) {
  let body: z.infer<typeof BodySchema>;
  {
    const parsed = BodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const detail = issue ? `${issue.path.join(".")}: ${issue.message}` : "invalid request";
      return NextResponse.json({ error: detail }, { status: 400 });
    }
    body = parsed.data;
  }
  try {
    return NextResponse.json({ comparison: await fetchExplanation(body) });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "request failed";
    const status = message.includes("not wired") ? 501 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
