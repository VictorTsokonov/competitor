// Run call A (expert pass) from the terminal, to tune the prompt without
// clicking through the UI:
//   npx tsx scripts/expert-pass.ts icmc-2019-p1
//   npx tsx scripts/expert-pass.ts path/to/problem.txt
// Prints the validated chain JSON, then a short report.

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { DUMMY_ANALYSES } from "../lib/dummy";
import { runExpertPass } from "../lib/providers/meta";

// Next loads .env.local for the server; this script runs outside Next.
function loadEnvLocal(): void {
  const file = resolve(__dirname, "..", ".env.local");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    const value = m[2].replace(/^(["'])(.*)\1$/, "$2");
    if (!(m[1] in process.env)) process.env[m[1]] = value;
  }
}

function problemText(arg: string): string {
  const byId = DUMMY_ANALYSES[arg] ?? DUMMY_ANALYSES[`seed-${arg}`];
  if (byId) return (byId as { problem: { text: string } }).problem.text;
  if (existsSync(arg)) return readFileSync(arg, "utf8").trim();
  const ids = Object.keys(DUMMY_ANALYSES).join(", ");
  throw new Error(`"${arg}" is neither a bundled problem id (${ids}) nor a file`);
}

async function main(): Promise<void> {
  loadEnvLocal();
  const arg = process.argv[2];
  if (!arg) {
    console.error("usage: npx tsx scripts/expert-pass.ts <problem-id | text-file>");
    console.error(`bundled ids: ${Object.keys(DUMMY_ANALYSES).join(", ")}`);
    process.exit(1);
  }
  const text = problemText(arg);
  const { data, attempts } = await runExpertPass(text);

  console.log("--- validated chain ---");
  console.log(JSON.stringify(data, null, 2));

  const first = attempts[0];
  let firstTry = `${data.spans.length}/${data.spans.length}`;
  if (first.issues) {
    const raw = first.raw as { spans?: unknown[] } | undefined;
    const total = Array.isArray(raw?.spans) ? raw.spans.length : undefined;
    const failed = first.issues.filter((i) => i.includes("not an exact substring")).length;
    firstTry =
      total === undefined
        ? "unknown (first attempt did not parse)"
        : `${total - failed}/${total}`;
  }
  const counts = (["setting", "definition", "rule", "goal", "informal"] as const)
    .map((c) => [c, data.spans.filter((s) => s.category === c).length] as const)
    .filter(([, n]) => n > 0)
    .map(([c, n]) => `${c}×${n}`)
    .join(", ");
  const ms = attempts.reduce((a, x) => a + x.durationMs, 0);
  const tok = (pick: (a: (typeof attempts)[number]) => number | undefined) =>
    attempts.reduce((a, x) => a + (pick(x) ?? 0), 0);

  console.log("--- expert pass report ---");
  console.log(`problem:           ${arg} (${text.length} chars)`);
  console.log(`span count:        ${data.spans.length}`);
  console.log(`first-try matches: ${firstTry} spans were exact substrings`);
  console.log(`categories:        ${counts}`);
  console.log(`retry used:        ${attempts.length > 1 ? "yes" : "no"}`);
  console.log(
    `duration:          ${(ms / 1000).toFixed(1)}s (${attempts
      .map((a, i) => `attempt ${i + 1}: ${(a.durationMs / 1000).toFixed(1)}s`)
      .join(", ")})`
  );
  console.log(
    `tokens:            prompt ${tok((a) => a.promptTokens)}, completion ${tok(
      (a) => a.completionTokens
    )}`
  );
}

main().catch((e: unknown) => {
  console.error(`\nexpert pass failed: ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
});
