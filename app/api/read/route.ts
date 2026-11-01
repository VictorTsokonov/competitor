import { NextResponse } from "next/server";
import { z } from "zod";
import { fetchAttempt, fetchStatementText } from "@/lib/analysis";

// One route for both image-reading purposes; the pages are JPEG data URLs
// prepared client-side by lib/pages.ts, so a raw PDF never reaches here.
const BodySchema = z
  .object({
    purpose: z.enum(["statement", "attempt"]),
    pages: z
      .array(
        z
          .string()
          .regex(/^data:image\//, "pages must be image data URLs")
          .max(2_500_000, "a page image is too large — re-add the file so it is recompressed")
      )
      .min(1, "add at least one page")
      .max(8, "at most 8 pages per read"),
    problemText: z.string().optional(),
    problemId: z.string().optional(),
  })
  .refine((b) => b.purpose !== "attempt" || !!b.problemText?.trim(), {
    message: "an attempt read needs the problem statement text",
  });

export async function POST(req: Request) {
  let body: z.infer<typeof BodySchema>;
  try {
    const parsed = BodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      const detail = parsed.error.issues[0]?.message ?? "invalid request";
      return NextResponse.json({ error: detail }, { status: 400 });
    }
    body = parsed.data;
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
  try {
    if (body.purpose === "statement") {
      return NextResponse.json(await fetchStatementText(body.pages));
    }
    const { student, report } = await fetchAttempt({
      problemText: body.problemText ?? "",
      pages: body.pages,
      problemId: body.problemId,
    });
    return NextResponse.json({ student, report });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "request failed";
    const status = message.includes("not wired") ? 501 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
