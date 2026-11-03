// The end of a job, once the final expert reading and the attempt are both
// in: the merged analysis is cached (the TypeScript comparison first,
// upgraded in place when the explain call lands), the problem turns
// Analysed, its record goes, and the explain call writes the feedback.
// The explain call's failure keeps the TypeScript comparison, so the panel
// never goes empty; the stage just offers a retry.

import { postJson } from "./postJson";
import { mergeAnalysis } from "./compare";
import { saveCachedAnalysis } from "./analysisCache";
import { clearJobRecord } from "./jobRecord";
import { currentJob, patchJob, setStage, type JobRef } from "./jobStore";
import { DONE, RUNNING, errorText, withStage } from "./jobTypes";
import { loadLibrary, saveLibrary, setProblemState } from "./problems";
import type { Comparison } from "./schema";

export function finish(ref: JobRef): void {
  const job = currentJob(ref);
  if (!job?.expert || job.analysed) return;
  // An expert-only job (no attempt pages) ends with the cached reading.
  if (job.stages.attempt.phase === "skipped") {
    clearJobRecord(job.storage, ref.problemId);
    return;
  }
  if (!job.attempt) return;
  saveCachedAnalysis(job.storage, ref.problemId, mergeAnalysis(job.expert, job.attempt));
  saveLibrary(
    job.storage,
    setProblemState(loadLibrary(job.storage), ref.problemId, "analysed")
  );
  clearJobRecord(job.storage, ref.problemId);
  patchJob(ref, (j) => ({ ...j, analysed: true }));
  window.dispatchEvent(new Event("competitor:library-changed"));
  void explain(ref);
}

export async function explain(ref: JobRef): Promise<void> {
  const ready = currentJob(ref);
  if (!ready?.expert || !ready.attempt) return;
  const { expert, attempt, solution } = ready;
  setStage(ref, "explain", RUNNING);
  let comparison: Comparison;
  try {
    ({ comparison } = await postJson<{ comparison: Comparison }>("/api/explain", {
      problemText: expert.problem.text,
      problemId: ref.problemId,
      expert: expert.expert,
      student: attempt.student,
      report: attempt.report,
      solution: solution ?? null,
    }));
  } catch (e: unknown) {
    setStage(ref, "explain", { phase: "error", message: errorText(e) });
    return;
  }
  const landed = patchJob(ref, (j) => ({ ...withStage(j, "explain", DONE), explain: comparison }));
  if (landed) {
    saveCachedAnalysis(landed.storage, ref.problemId, mergeAnalysis(expert, attempt, comparison));
  }
}
