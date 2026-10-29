// Saved workflow: researcher. Args: { question: string }.
// Answers with inspected evidence (code bodies, docs, URLs). No code changes.
export default async function workflow(host) {
  let args = host.args || {};
  if (typeof args === "string") {
    try {
      args = JSON.parse(args);
    } catch {
      args = {};
    }
  }
  const question = args.question || "No question supplied.";
  const schema = {
    type: "object",
    required: ["complete", "evidence", "unresolved"],
    properties: {
      complete: { type: "boolean" },
      evidence: { type: "array", items: { type: "string" } },
      unresolved: { type: "array", items: { type: "string" } },
    },
  };
  const answer = await host.agent({
    input: `Question: ${question}\nInvestigate using the repo (open every file body you cite), project docs, and the web when needed. Return the answer with compact evidence: file paths with line numbers, doc quotes, or exact URLs you actually obtained. Name anything you could not resolve. Use the schema.`,
    schema,
  });
  const report = {
    question,
    answer: answer
      ? { ref: answer.ref, data: answer.data, text: answer.text, notes: answer.notes }
      : null,
  };
  return { ...report, summary: JSON.stringify(report) };
}
