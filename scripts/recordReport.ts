import type { Example } from "../lib/demoExamples";
import type { Solution } from "../lib/schema";
import { checkRubric } from "./rubric";

// What a recording decided, printed so a weak run can be dropped before
// the next one: the private verdict (never written), the expert's route
// and heaviest spans, the attempt read, and the feedback as recorded.
export function printRecording(r: {
  n: number;
  id: string;
  example: Example;
  solution: Solution | null;
  explained: boolean;
  started: number;
}): void {
  const { meta, analysis } = r.example;
  const { expert, student, comparison } = analysis;
  const report = analysis.attempt_report;
  const seconds = ((Date.now() - r.started) / 1000).toFixed(0);

  console.log(`\n=== Example ${r.n}: ${meta.source} (${r.id}) in ${seconds}s ===`);
  console.log("--- call S (private, not written) ---");
  console.log(`verified:     ${r.solution?.verified ? "yes" : "NO"}`);
  console.log(`final line:   ${r.solution?.final_line ?? "none"}`);
  console.log(`grounded:     ${analysis.grounded ? "yes" : "no"} (written)`);

  console.log("--- expert reading (A -> B -> R) ---");
  console.log(`chosen:       ${expert.method.chosen}`);
  for (const c of expert.method.candidates) {
    console.log(`  ${c.kept ? "kept   " : "dropped"} ${c.name}`);
  }
  const heaviest = [...expert.spans].sort((a, b) => b.weight - a.weight).slice(0, 4);
  for (const s of heaviest) console.log(`  span ${s.weight}: "${s.text}"`);
  console.log(`simplify:     ${expert.simplification.instance}`);
  const rubric = checkRubric(r.id, expert);
  if (rubric) {
    for (const c of rubric) console.log(`  rubric ${c.pass ? "PASS" : "FAIL"} ${c.name}: ${c.detail}`);
  }

  console.log("--- attempt (call C) ---");
  console.log(
    `structure:    ${report?.structure ?? "?"}; ${student.spans.length} span(s); method "${student.method.chosen || "none"}"`
  );
  console.log(`missing:      ${report?.missing_stages.join(", ") || "none"}`);
  for (const note of report?.legibility ?? []) console.log(`  hard to read: ${note}`);

  console.log(`--- feedback (${r.explained ? "explain call" : "compare.ts fallback"}) ---`);
  console.log(`where you are: ${comparison.where_you_are}`);
  console.log(`divergence:    ${comparison.first_divergence}`);
  comparison.cards.forEach((c, i) => {
    console.log(`card ${i + 1} [${c.kind}]`);
    console.log(`  evidence:    ${c.evidence_student}`);
    console.log(`  diagnosis:   ${c.diagnosis}`);
    console.log(`  redirection: ${c.redirection}`);
    console.log(`  self-check:  ${c.self_check}`);
  });
  console.log(`where next:    ${comparison.where_to_next}`);

  console.log("--- written ---");
  console.log(`lib/examples/example-${r.n}.json (solution stripped, leak check passed)`);
  console.log(`public/examples/${r.n}/: ${meta.pages.length} page(s)`);
}
