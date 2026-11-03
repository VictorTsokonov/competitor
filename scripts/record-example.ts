// Record one real run of the production pipeline as a demo example:
//   npx tsx scripts/record-example.ts icmc-2019-p2 [--n 1] [--source "ICMC 2019 Problem 2"]
// Drives the same server seam the API routes use (lib/analysis.ts) in the
// order the dashboard runs it (lib/jobPipeline.ts): call S, then the
// expert reading (A -> B -> R) alongside call C on the attempt pages, then
// the explain call, falling back to compare.ts as the dashboard does.
// Input: fixtures/statements/<id>.txt and fixtures/attempts/<id>/page-*.jpg,
// prepared like the browser prepares uploads. Output: lib/examples/
// example-<n>.json (solution stripped, fails loudly if any survives) and
// the pages the model read in public/examples/<n>/. Then add the printed
// line to lib/examples/index.ts.

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import sharp from "sharp";
import { appMode } from "../lib/mode";
import { fetchAnalysis, fetchAttempt, fetchExplanation, fetchSolution } from "../lib/analysis";
import { mergeAnalysis } from "../lib/compare";
import { ExampleSchema } from "../lib/demoExamples";
import { JPEG_QUALITY, LONG_EDGE } from "../lib/pages";
import { META_MODEL } from "../lib/providers/meta/client";
import type { Comparison } from "../lib/schema";
import { assertNoSolution, stripSolution } from "./stripSolution";
import { printRecording } from "./recordReport";

const ROOT = resolve(__dirname, "..");
const EXAMPLES_DIR = join(ROOT, "lib", "examples");

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

function flag(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

// The next free slot: one past the highest example-<n>.json on disk.
function nextNumber(): number {
  const taken = readdirSync(EXAMPLES_DIR)
    .map((f) => f.match(/^example-(\d+)\.json$/)?.[1])
    .filter((n): n is string => !!n)
    .map(Number);
  return taken.length === 0 ? 1 : Math.max(...taken) + 1;
}

// "icmc-2019-p2" -> "ICMC 2019 Problem 2"; anything else needs --source.
function sourceFor(id: string): string {
  const m = id.match(/^([a-z]+)-(\d{4})-p(\d+)$/);
  if (!m) throw new Error(`can't name the source of "${id}": pass --source "…"`);
  return `${m[1].toUpperCase()} ${m[2]} Problem ${m[3]}`;
}

function fixture(id: string): { problemText: string; pageFiles: string[] } {
  const statementFile = join(ROOT, "fixtures", "statements", `${id}.txt`);
  const attemptDir = join(ROOT, "fixtures", "attempts", id);
  if (!existsSync(statementFile) || !existsSync(attemptDir)) {
    throw new Error(`fixture "${id}" needs statements/${id}.txt and attempts/${id}/page-*.jpg`);
  }
  const pageFiles = readdirSync(attemptDir)
    .filter((f) => /^page-\d+\.jpe?g$/i.test(f))
    .sort((a, b) => Number(a.match(/\d+/)?.[0]) - Number(b.match(/\d+/)?.[0]))
    .map((f) => join(attemptDir, f));
  if (pageFiles.length === 0) throw new Error(`no page-*.jpg files in ${attemptDir}`);
  return { problemText: readFileSync(statementFile, "utf8").trim(), pageFiles };
}

// Same preparation as lib/pages.ts in the browser: long edge at most
// LONG_EDGE, JPEG at JPEG_QUALITY (sharp also drops any EXIF).
function preparePage(file: string): Promise<Buffer> {
  return sharp(file)
    .rotate()
    .resize({ width: LONG_EDGE, height: LONG_EDGE, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: Math.round(JPEG_QUALITY * 100) })
    .toBuffer();
}

async function main(): Promise<void> {
  loadEnvLocal();
  const args = process.argv.slice(2);
  const id = args[0];
  if (!id || id.startsWith("--")) {
    console.error("usage: npx tsx scripts/record-example.ts <fixture-id> [--n <number>] [--source <text>]");
    process.exit(1);
  }
  if (appMode() !== "live") {
    throw new Error("recording needs live mode: set USE_MOCK=false and MODEL_API_KEY in .env.local");
  }
  const n = flag(args, "--n") ? Number(flag(args, "--n")) : nextNumber();
  if (!Number.isInteger(n) || n < 1) throw new Error("--n must be a positive integer");
  const source = flag(args, "--source") ?? sourceFor(id);
  const { problemText, pageFiles } = fixture(id);
  const pages = await Promise.all(pageFiles.map(preparePage));
  const dataUrls = pages.map((b) => `data:image/jpeg;base64,${b.toString("base64")}`);
  const started = Date.now();

  console.log(`[1/3] call S: solve + verify (${source})…`);
  const solution = await fetchSolution(problemText);
  console.log(`[2/3] calls A -> B -> R alongside call C (${pages.length} page(s))…`);
  const [expert, attempt] = await Promise.all([
    fetchAnalysis({ problemText, solution }),
    fetchAttempt({ problemText, pages: dataUrls }),
  ]);
  console.log("[3/3] explain call…");
  let comparison: Comparison | undefined;
  try {
    comparison = await fetchExplanation({
      problemText: expert.problem.text,
      expert: expert.expert,
      student: attempt.student,
      report: attempt.report,
      solution,
    });
  } catch (e: unknown) {
    console.log(
      `WARNING: explain call failed (${e instanceof Error ? e.message : "error"}); recording the compare.ts fallback the dashboard would show`
    );
  }

  const analysis = stripSolution(mergeAnalysis(expert, attempt, comparison), solution);
  const pagePaths = pages.map((_, i) => `/examples/${n}/page-${i + 1}.jpg`);
  const example = ExampleSchema.parse({
    meta: {
      source,
      fixture: id,
      recorded_at: new Date().toISOString(),
      model: META_MODEL,
      pages: pagePaths,
    },
    analysis,
  });
  assertNoSolution(example, solution);

  const pagesDir = join(ROOT, "public", "examples", String(n));
  rmSync(pagesDir, { recursive: true, force: true });
  mkdirSync(pagesDir, { recursive: true });
  pages.forEach((page, i) => writeFileSync(join(pagesDir, `page-${i + 1}.jpg`), page));
  const file = join(EXAMPLES_DIR, `example-${n}.json`);
  writeFileSync(file, `${JSON.stringify(example, null, 2)}\n`);

  printRecording({ n, id, example, solution, explained: !!comparison, started });
  const line = `  ${n}: () => import("./example-${n}.json"),`;
  const index = readFileSync(join(EXAMPLES_DIR, "index.ts"), "utf8");
  console.log(
    index.includes(`./example-${n}.json`)
      ? `lib/examples/index.ts already lists example ${n}.`
      : `Add this line to EXAMPLE_FILES in lib/examples/index.ts:\n${line}`
  );
}

main().catch((e: unknown) => {
  console.error(`\nrecording failed: ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
});
