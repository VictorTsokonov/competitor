import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/apiError";
import { fetchAnalysis } from "@/lib/analysis";
import { SolutionSchema } from "@/lib/schema";

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json().catch(() => ({}));
    const str = (key: string): string | undefined =>
      typeof body === "object" && body !== null && key in body &&
      typeof (body as Record<string, unknown>)[key] === "string"
        ? ((body as Record<string, unknown>)[key] as string)
        : undefined;
    // The client-held call S result; anything malformed is simply ignored.
    const rawSolution =
      typeof body === "object" && body !== null
        ? (body as Record<string, unknown>).solution
        : undefined;
    const solution = SolutionSchema.safeParse(rawSolution);
    return NextResponse.json(
      await fetchAnalysis({
        problemText: str("problemText") ?? "",
        problemId: str("problemId"),
        solution: solution.success ? solution.data : null,
      })
    );
  } catch (e: unknown) {
    return errorResponse(e);
  }
}
