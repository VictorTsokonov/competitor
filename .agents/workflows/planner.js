// Saved workflow: planner. Args: { task: string }.
// Maps the relevant code, then returns a sliced implementation plan. No code changes.
export default async function workflow(host) {
  let args = host.args || {};
  if (typeof args === "string") {
    try {
      args = JSON.parse(args);
    } catch {
      args = {};
    }
  }
  const task = args.task || "No task supplied.";
  const schema = {
    type: "object",
    required: ["complete", "evidence", "unresolved"],
    properties: {
      complete: { type: "boolean" },
      evidence: { type: "array", items: { type: "string" } },
      unresolved: { type: "array", items: { type: "string" } },
    },
  };
  const scout = await host.agent({
    input: `Task: ${task}\nRead PROJECT_BRIEF.md, WORKFLOW.md, and the repo files this task touches (open each body; do not change anything). Return the concrete file paths involved, the contracts/constraints that bind the change, and what is still unknown. Use the schema.`,
    schema,
  });
  const plan = await host.agent({
    input: `Task: ${task}\nScouting result ref: ${scout ? scout.ref : "none"}.\nWrite an implementation plan as ordered slices: each slice names its files, its exact behavior (happy path plus edge/negative cases), and how it will be verified (build, lint, render or behavior check). Keep slices small enough for ~1-2 hours each. Obey WORKFLOW.md and PROJECT_BRIEF.md. Use the schema; put the plan in evidence lines.`,
    schema,
  });
  const report = {
    task,
    scout: scout ? { ref: scout.ref, data: scout.data, notes: scout.notes } : null,
    plan: plan ? { ref: plan.ref, data: plan.data, text: plan.text, notes: plan.notes } : null,
  };
  return { ...report, summary: JSON.stringify(report) };
}
