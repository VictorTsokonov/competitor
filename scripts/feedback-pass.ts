// Run the whole grounded pipeline over a private fixture from the
// terminal: solve+verify -> expert reading (A+B, grounded) -> student
// extraction (C) -> explain (feedback). Prints what each stage decided
// and the final feedback cards.
//   npx tsx scripts/feedback-pass.ts icmc-2019-p2

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { runSolve } from "../lib/providers/meta/solve";
import { requestExpertPass } from "../lib/providers/meta";
import { readPages } from "../lib/providers/meta/vision";
import { runExplain } from "../lib/providers/meta/explain";
import { compareSkeleton } from "../lib/compare";

const ROOT = resolve(__dirname, "..");

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

function fixture(id: string): { problemText: string; pages: string[] } {
  const statementFile = join(ROOT, "fixtures", "statements", `${id}.txt`);
  const attemptDir = join(ROOT, "fixtures", "attempts", id);
  if (!existsSync(statementFile) || !existsSync(attemptDir)) {
    throw new Error(`fixture "${id}" needs statements/${id}.txt and attempts/${id}/`);
  }
  const files = readdirSync(attemptDir)
    .filter((f) => /^page-\d+\.jpe?g$/i.test(f))
    .sort((a, b) => Number(a.match(/\d+/)?.[0]) - Number(b.match(/\d+/)?.[0]));
  return {
    problemText: readFileSync(statementFile, "utf8").trim(),
    pages: files.map(
      (f) => `data:image/jpeg;base64,${readFileSync(join(attemptDir, f)).toString("base64")}`
    ),
  };
}

async function main(): Promise<void> {
  loadEnvLocal();
  const id = process.argv[2];
  if (!id) {
    console.error("usage: npx tsx scripts/feedback-pass.ts <fixture-id>");
    process.exit(1);
  }
  const { problemText, pages } = fixture(id);
  const t0 = Date.now();

  console.log("[1/4] solving…");
  const { solution } = await runSolve(problemText);
  console.log(`      verified=${solution.verified} route: ${solution.route}`);

  console.log("[2/4] expert reading (grounded, A+B)…");
  const expert = await requestExpertPass(problemText, solution);
  console.log(`      method.chosen: ${expert.method.chosen}`);

  console.log("[3/4] reading the attempt…");
  const { data: extraction } = await readPages({ purpose: "attempt", pages, problemText });
  console.log(
    `      structure=${extraction.report.structure}, spans=${extraction.chain.spans.length}, dropped methods: ${extraction.chain.method.candidates
      .filter((c) => !c.kept)
      .map((c) => c.name)
      .join(" | ") || "none"}`
  );

  console.log("[4/4] writing feedback…");
  const { data: comparison } = await runExplain({
    problemText,
    expert,
    student: extraction.chain,
    report: extraction.report,
    solution,
  });

  console.log("--- computed skeleton ---");
  console.log(JSON.stringify(compareSkeleton(expert, extraction.chain), null, 1));
  console.log("--- feedback ---");
  console.log(JSON.stringify(comparison, null, 2));
  console.log(`--- done in ${((Date.now() - t0) / 1000).toFixed(0)}s ---`);
}

main().catch((e: unknown) => {
  console.error(`\nfeedback pass failed: ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
});
