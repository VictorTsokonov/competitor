// Saved workflow: builder. Args: { slice: string, plan?: string }.
// Implements exactly one slice, then builds and lints. Reports files and verification.
export default async function workflow(host) {
  let args = host.args || {};
  if (typeof args === "string") {
    try {
      args = JSON.parse(args);
    } catch {
      args = {};
    }
  }
  const slice = args.slice || "No slice supplied.";
  const plan = args.plan ? `\nApproved plan:\n${args.plan}` : "";
  const result = await host.agent({
    input: `Read PROJECT_BRIEF.md and WORKFLOW.md first. Implement exactly this slice and nothing else:\n${slice}${plan}\nRules: boring readable code, files under ~150 lines, TypeScript strict, no any. Then run npm run build and npm run lint and fix every error. Do not commit. Return: files changed, commands run with results, and anything you could not verify.`,
  });
  const report = {
    slice,
    result: result
      ? { ref: result.ref, text: result.text, notes: result.notes, error_kind: result.error_kind || null }
      : null,
  };
  return { ...report, summary: JSON.stringify(report) };
}
