import { NextResponse } from "next/server";
import { fetchSolution } from "@/lib/analysis";

// Call S: the private solution that grounds the expert reading and the
// feedback. The response is cached client-side with the analysis but
// never rendered; solution is null in mock mode (no solver to run).
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
    const message = e instanceof Error ? e.message : "request failed";
    const status = message.includes("not wired") ? 501 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
