import { NextResponse } from "next/server";
import { fetchAnalysis } from "@/lib/analysis";

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json().catch(() => ({}));
    const problemText =
      typeof body === "object" && body !== null && "problemText" in body &&
      typeof (body as { problemText: unknown }).problemText === "string"
        ? (body as { problemText: string }).problemText
        : "";
    return NextResponse.json(await fetchAnalysis({ problemText }));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "request failed";
    const status = message.includes("not wired") ? 501 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
