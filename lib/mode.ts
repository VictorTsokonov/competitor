// Which product this deploy is, decided on the server from env and never
// by the browser: "demo" serves the recorded example runs in lib/examples/
// and never calls the model; "live" runs the full pipeline on the user's
// own library. Anything but USE_MOCK=false is demo, so a deploy with the
// variable missing fails closed even when a key is set.

export type AppMode = "demo" | "live";

export function appMode(): AppMode {
  return process.env.USE_MOCK === "false" ? "live" : "demo";
}

export const DEMO_MESSAGE =
  "This is a demo of recorded runs. Clone the repo and add your own Meta API key to analyse your own problems.";

// Thrown at the provider seam (lib/analysis.ts) and again in the Meta
// client, so no code path reaches the model in demo mode; lib/apiError.ts
// turns it into a 403 with a clear demo-mode body.
export class DemoModeError extends Error {
  constructor() {
    super(`Demo mode makes no model calls. ${DEMO_MESSAGE}`);
    this.name = "DemoModeError";
  }
}
