// Run call S (solve + sceptical verify) from the terminal, to tune the
// prompts without clicking through the UI:
//   npx tsx scripts/solve-pass.ts icmc-2019-p2
//   npx tsx scripts/solve-pass.ts path/to/problem.txt
// Prints the validated solution and a short report.

import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { DUMMY_ANALYSES } from "../lib/dummy";
import { runSolve } from "../lib/providers/meta/solve";

const ROOT = resolve(__dirname, "..");

// Next loads .env.local for the server; this script runs outside Next.
function loadEnvLocal(): void {
  const file = join(ROOT, ".env.local");
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
  const fixture = join(ROOT, "fixtures", "statements", `${arg}.txt`);
  if (existsSync(fixture)) return readFileSync(fixture, "utf8").trim();
  if (existsSync(arg)) return readFileSync(arg, "utf8").trim();
  throw new Error(
    `"${arg}" is neither a bundled id (${Object.keys(DUMMY_ANALYSES).join(", ")}), a fixtures/statements id, nor a file`
  );
}

async function main(): Promise<void> {
  loadEnvLocal();
  const arg = process.argv[2];
  if (!arg) {
    console.error("usage: npx tsx scripts/solve-pass.ts <problem-id | fixture-id | text-file>");
    process.exit(1);
  }
  const text = problemText(arg);
  const { solution, attempts } = await runSolve(text);

  console.log("--- solution (private grounding, never rendered) ---");
  console.log(JSON.stringify(solution, null, 2));

  const ms = attempts.reduce((a, x) => a + x.durationMs, 0);
  const tok = (pick: (a: (typeof attempts)[number]) => number | undefined) =>
    attempts.reduce((a, x) => a + (pick(x) ?? 0), 0);
  console.log("--- solve pass report ---");
  console.log(`problem:        ${arg} (${text.length} chars)`);
  console.log(`verified:       ${solution.verified ? "yes" : "NO"}`);
  for (const note of solution.verification_notes) console.log(`  - ${note}`);
  console.log(`route:          ${solution.route}`);
  console.log(`final line:     ${solution.final_line}`);
  console.log(`small case:     ${solution.small_case.instance}`);
  console.log(`key steps:      ${solution.key_steps.length}`);
  console.log(`model calls:    ${attempts.length}`);
  console.log(`duration:       ${(ms / 1000).toFixed(1)}s`);
  console.log(
    `tokens:         prompt ${tok((a) => a.promptTokens)}, completion ${tok((a) => a.completionTokens)}`
  );
}

main().catch((e: unknown) => {
  console.error(`\nsolve pass failed: ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
});
