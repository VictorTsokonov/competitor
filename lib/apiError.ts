import { NextResponse } from "next/server";
import { DemoModeError } from "./mode";

// One error shape for every API route: a demo-mode refusal is a 403 whose
// message the client can show as is; anything else is a 500.
export function errorResponse(e: unknown): NextResponse {
  if (e instanceof DemoModeError) {
    return NextResponse.json({ error: e.message, mode: "demo" }, { status: 403 });
  }
  const message = e instanceof Error ? e.message : "request failed";
  return NextResponse.json({ error: message }, { status: 500 });
}
