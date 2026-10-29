// Saved workflow: reviewer. Args: { scope?: string } (paths or diff description; default: working tree).
// Adversarial review against the brief, conventions, and verification honesty. No code changes.
export default async function workflow(host) {
  let args = host.args || {};
  if (typeof args === "string") {
    try {
      args = JSON.parse(args);
    } catch {
      args = {};
    }
  }
  const scope = args.scope || "the full working tree (git status / git diff)";
  const schema = {
    type: "object",
    required: ["complete", "evidence", "unresolved"],
    properties: {
      complete: { type: "boolean" },
      evidence: { type: "array", items: { type: "string" } },
      unresolved: { type: "array", items: { type: "string" } },
    },
  };
  const checks = await host.parallel([
    {
      input: `Scope: ${scope}\nReview correctness and conventions: read every changed file body. Check contract fidelity (every requested behavior incl. edge/negative cases), TypeScript strictness, ~150-line files, no dead code, error handling. List each finding as file:line + problem + suggested fix. Use the schema.`,
      schema,
    },
    {
      input: `Scope: ${scope}\nReview brief compliance and verification honesty: read PROJECT_BRIEF.md and WORKFLOW.md, then the changed files. Check visual/product rules, schema rules, and that claimed verification (build/lint/checks) is real and sufficient. List each finding as file:line + problem + suggested fix. Use the schema.`,
      schema,
    },
  ]);
  const verdict = await host.agent({
    input: `Synthesize these two review reports into one verdict: ${JSON.stringify(checks.map((r) => (r ? r.ref : null)))}.\nDeduplicate findings, rank by severity, and give a clear PASS or FAIL with the smallest fix list that earns a pass. Read both result refs before synthesizing.`,
  });
  const report = {
    scope,
    checks: checks.map((r) =>
      r ? { ref: r.ref, data: r.data, notes: r.notes } : null
    ),
    verdict: verdict ? { ref: verdict.ref, text: verdict.text, notes: verdict.notes } : null,
  };
  return { ...report, summary: JSON.stringify(report) };
}
