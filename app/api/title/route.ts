import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/apiError";
import { z } from "zod";
import { fetchTitle } from "@/lib/analysis";

// A short plain-text library name for a new problem, read from its
// statement (lib/providers/meta/title.ts). The client keeps its own
// provisional name when this fails, so a failure costs nothing visible.
const BodySchema = z.object({
  problemText: z.string().trim().min(1, "the problem statement is empty"),
});

export async function POST(req: Request) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const detail = parsed.error.issues[0]?.message ?? "invalid request";
    return NextResponse.json({ error: detail }, { status: 400 });
  }
  try {
    return NextResponse.json({ title: await fetchTitle(parsed.data.problemText) });
  } catch (e: unknown) {
    return errorResponse(e);
  }
}
