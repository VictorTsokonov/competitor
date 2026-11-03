import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/apiError";
import { fetchSolution } from "@/lib/analysis";

// Call S: the private solution that grounds the expert reading and the
// feedback. The response is cached client-side with the analysis but
// never rendered; demo mode refuses (lib/analysis.ts).
export async function POST(req: Request) {
  try {
    const body: unknown = await req.json().catch(() => ({}));
    const problemText =
      typeof body === "object" && body !== null && "problemText" in body &&
      typeof (body as Record<string, unknown>).problemText === "string"
        ? ((body as Record<string, unknown>).problemText as string)
        : "";
    return NextResponse.json({ solution: await fetchSolution(problemText) });
  } catch (e: unknown) {
    return errorResponse(e);
  }
}
