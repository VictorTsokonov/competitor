// Run call C (student extraction) from the terminal over a private fixture,
// to tune the prompt without clicking through the UI:
//   npx tsx scripts/attempt-pass.ts icmc-2020-p6
// Expects fixtures/statements/<id>.txt and fixtures/attempts/<id>/page-*.jpg
// (fixtures/ is git-ignored; see fixtures/README.md). Prints the validated
// student chain, the structure report, and a short stats report.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { readPages } from "../lib/providers/meta/vision";

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

function fixture(id: string): { problemText: string; pages: string[]; files: string[] } {
  const statementFile = join(ROOT, "fixtures", "statements", `${id}.txt`);
  const attemptDir = join(ROOT, "fixtures", "attempts", id);
  if (!existsSync(statementFile) || !existsSync(attemptDir)) {
    throw new Error(
      `fixture "${id}" needs fixtures/statements/${id}.txt and fixtures/attempts/${id}/page-*.jpg`
    );
  }
  const files = readdirSync(attemptDir)
    .filter((f) => /^page-\d+\.jpe?g$/i.test(f))
    .sort((a, b) => Number(a.match(/\d+/)?.[0]) - Number(b.match(/\d+/)?.[0]));
  if (files.length === 0) throw new Error(`no page-*.jpg files in ${attemptDir}`);
  const pages = files.map(
    (f) => `data:image/jpeg;base64,${readFileSync(join(attemptDir, f)).toString("base64")}`
  );
  return { problemText: readFileSync(statementFile, "utf8").trim(), pages, files };
}

async function main(): Promise<void> {
  loadEnvLocal();
  const id = process.argv[2];
  if (!id) {
    console.error("usage: npx tsx scripts/attempt-pass.ts <fixture-id>");
    const dir = join(ROOT, "fixtures", "attempts");
    if (existsSync(dir)) console.error(`fixture ids: ${readdirSync(dir).join(", ")}`);
    process.exit(1);
  }
  const { problemText, pages, files } = fixture(id);
  const { data, attempts } = await readPages({ purpose: "attempt", pages, problemText });
  const { chain, report } = data;

  console.log("--- validated student chain ---");
  console.log(JSON.stringify(chain, null, 2));
  console.log("--- structure report ---");
  console.log(JSON.stringify(report, null, 2));

  const first = attempts[0];
  let firstTry = `${chain.spans.length}/${chain.spans.length}`;
  if (first.issues) {
    const raw = first.raw as { chain?: { spans?: unknown[] } } | undefined;
    const total = Array.isArray(raw?.chain?.spans) ? raw.chain.spans.length : undefined;
    const failed = first.issues.filter((i) => i.includes("not an exact substring")).length;
    firstTry =
      total === undefined
        ? "unknown (first attempt did not parse)"
        : `${total - failed}/${total}`;
  }
  const uncertain = chain.spans.filter((s) => s.uncertain).length;
  const empty = (
    [
      ["goal", chain.goal.asked === ""],
      ["abstraction", chain.abstraction.underneath.length === 0],
      ["simplification", chain.simplification.instance === ""],
      ["method", chain.method.candidates.length === 0],
      ["second_reading", chain.second_reading.what_changed === ""],
    ] as const
  )
    .filter(([, isEmpty]) => isEmpty)
    .map(([name]) => name);
  const ms = attempts.reduce((a, x) => a + x.durationMs, 0);
  const tok = (pick: (a: (typeof attempts)[number]) => number | undefined) =>
    attempts.reduce((a, x) => a + (pick(x) ?? 0), 0);

  console.log("--- attempt pass report ---");
  console.log(`fixture:           ${id} (${files.length} page(s): ${files.join(", ")})`);
  console.log(`structure:         ${report.structure}`);
  console.log(`inferred stages:   ${report.inferred_stages.join(", ") || "none"}`);
  console.log(`missing stages:    ${report.missing_stages.join(", ") || "none"}`);
  console.log(`legibility notes:  ${report.legibility.length === 0 ? "none" : ""}`);
  for (const note of report.legibility) console.log(`  - ${note}`);
  console.log(`span count:        ${chain.spans.length} (${uncertain} uncertain)`);
  console.log(`first-try matches: ${firstTry} spans were exact substrings`);
  console.log(`empty stages:      ${empty.join(", ") || "none"}`);
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
  console.error(`\nattempt pass failed: ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
});
