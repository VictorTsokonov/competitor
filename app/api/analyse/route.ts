import { NextResponse } from "next/server";
import { AnalysisSchema } from "@/lib/schema";
import dummyData from "@/lib/dummy-data.json";

export async function POST() {
  if (process.env.USE_MOCK === "true") {
    const parsed = AnalysisSchema.safeParse(dummyData);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "mock data failed validation", issues: parsed.error.issues },
        { status: 500 }
      );
    }
    return NextResponse.json(parsed.data);
  }
  return NextResponse.json(
    { error: "real model not wired yet" },
    { status: 501 }
  );
}
