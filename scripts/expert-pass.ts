// Run call A (expert pass) from the terminal, to tune the prompt without
// clicking through the UI:
//   npx tsx scripts/expert-pass.ts icmc-2019-p1
//   npx tsx scripts/expert-pass.ts path/to/problem.txt
//   npx tsx scripts/expert-pass.ts icmc-2019-p2 --grounded
// --grounded runs the production chain: call S first, then A, B and the
// audit R against the verified solution. Bundled ids also get a rubric
// report (scripts/rubric.ts) so prompt changes are pass/fail, not vibes.

import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { DUMMY_ANALYSES } from "../lib/dummy";
import type { Chain, Solution } from "../lib/schema";
import { runExpertPass, runSecondReading } from "../lib/providers/meta";
import { runChainAudit, type ChainAudit } from "../lib/providers/meta/audit";
import { runSolve } from "../lib/providers/meta/solve";
import { checkRubric } from "./rubric";

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
  const ids = Object.keys(DUMMY_ANALYSES).join(", ");
  throw new Error(
    `"${arg}" is neither a bundled id (${ids}), a fixtures/statements id, nor a file`
  );
}

type Report = { chain: Chain; solution: Solution | null; audit: ChainAudit | null };

async function runUngrounded(text: string): Promise<Report> {
  const { data, attempts } = await runExpertPass(text);
  const first = attempts[0];
  if (first.issues) {
    console.log(`first attempt failed validation (${first.issues.length} issue(s)):`);
    for (const i of first.issues.slice(0, 8)) console.log(`  - ${i}`);
  }
  return { chain: data, solution: null, audit: null };
}

async function runGrounded(text: string): Promise<Report> {
  const { solution } = await runSolve(text);
  console.log(`call S: verified=${solution.verified ? "yes" : "NO"} route=${solution.route}`);
  if (!solution.verified) {
    console.log("solution failed verification — proceeding ungrounded, no audit");
    return runUngrounded(text);
  }
  const first = (await runExpertPass(text, solution)).data;
  let chain = first;
  try {
    chain = (await runSecondReading(text, first, solution)).data;
  } catch {
    console.log("call B failed; keeping the first reading");
  }
  const audited = await runChainAudit(text, chain, solution);
  return { chain: audited.chain, solution, audit: audited.audit };
}

function printReport(arg: string, text: string, r: Report): void {
  console.log("--- validated chain ---");
  console.log(JSON.stringify(r.chain, null, 2));
  const counts = (["setting", "definition", "rule", "goal", "informal"] as const)
    .map((c) => [c, r.chain.spans.filter((s) => s.category === c).length] as const)
    .filter(([, n]) => n > 0)
    .map(([c, n]) => `${c}×${n}`)
    .join(", ");
  console.log("--- expert pass report ---");
  console.log(`problem:        ${arg} (${text.length} chars)`);
  console.log(`span count:     ${r.chain.spans.length} (${counts})`);
  if (r.audit) {
    console.log(`audit verdict:  ${r.audit.verdict}${r.audit.revised ? " (revised once)" : ""}`);
    for (const n of r.audit.notes) console.log(`  - ${n}`);
  }
  const rubric = checkRubric(arg, r.chain);
  if (rubric) {
    const failed = rubric.filter((c) => !c.pass).length;
    console.log(`rubric:         ${rubric.length - failed}/${rubric.length} checks pass`);
    for (const c of rubric) console.log(`  ${c.pass ? "PASS" : "FAIL"}  ${c.name}: ${c.detail}`);
  }
}

async function main(): Promise<void> {
  loadEnvLocal();
  const args = process.argv.slice(2);
  const grounded = args.includes("--grounded");
  const arg = args.find((a) => !a.startsWith("--"));
  if (!arg) {
    console.error("usage: npx tsx scripts/expert-pass.ts <problem-id | text-file> [--grounded]");
    console.error(`bundled ids: ${Object.keys(DUMMY_ANALYSES).join(", ")}`);
    process.exit(1);
  }
  const text = problemText(arg);
  const started = Date.now();
  const report = grounded ? await runGrounded(text) : await runUngrounded(text);
  printReport(arg, text, report);
  console.log(`duration:       ${((Date.now() - started) / 1000).toFixed(1)}s total`);
}

main().catch((e: unknown) => {
  console.error(`\nexpert pass failed: ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
});
