import { NextResponse } from "next/server";
import { fetchAnalysis } from "@/lib/analysis";

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json().catch(() => ({}));
    const str = (key: string): string | undefined =>
      typeof body === "object" && body !== null && key in body &&
      typeof (body as Record<string, unknown>)[key] === "string"
        ? ((body as Record<string, unknown>)[key] as string)
        : undefined;
    return NextResponse.json(
      await fetchAnalysis({ problemText: str("problemText") ?? "", problemId: str("problemId") })
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "request failed";
    const status = message.includes("not wired") ? 501 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
