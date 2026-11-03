// The expert's reading as three requests to /api/expert, one per step, so
// each is shown and kept as it lands: first (call A), second (call B,
// re-weighing what matters), audit (call R, only against a verified
// solution). A failed second or audit keeps the reading before it; only
// the final chain becomes the rendered reading. A cached final reading
// skips all three, and an interrupted run's record resumes after the last
// step it finished.

import { postJson } from "./postJson";
import { loadCachedAnalysis, saveCachedAnalysis } from "./analysisCache";
import { loadJobRecord, updateJobRecord } from "./jobRecord";
import { currentJob, patchJob, setStage, type JobRef } from "./jobStore";
import {
  DONE,
  KEPT,
  RUNNING,
  errorText,
  withStage,
  type AnalysisJob,
  type ExpertReading,
  type Stage,
} from "./jobTypes";
import type { ExpertStep, ExpertStepResult } from "./providers/types";

const STEPS: ExpertStep[] = ["first", "second", "audit"];

// One step's request. null: its job was replaced or cleared meanwhile.
async function request(
  ref: JobRef,
  step: ExpertStep,
  from?: ExpertReading
): Promise<ExpertStepResult | Error | null> {
  const job = setStage(ref, step, RUNNING);
  if (!job) return null;
  try {
    const result = await postJson<ExpertStepResult>("/api/expert", {
      step,
      problemText: job.statement,
      problemId: ref.problemId,
      chain: from?.analysis.expert,
      solution: job.solution ?? null,
    });
    return currentJob(ref) ? result : null;
  } catch (e: unknown) {
    return currentJob(ref) ? new Error(errorText(e)) : null;
  }
}

// A finished step, kept on the job and in its record so that a reload
// resumes after it.
function keep(ref: JobRef, reading: ExpertReading, stage: Stage): void {
  const job = patchJob(ref, (j) => ({ ...withStage(j, reading.step, stage), reading }));
  if (job) updateJobRecord(job.storage, ref.problemId, job.statement, { reading });
}

// The steps up to and including `last` came from an earlier run.
function markKept(job: AnalysisJob, last: ExpertStep): AnalysisJob {
  const upTo = STEPS.slice(0, STEPS.indexOf(last) + 1);
  return upTo.reduce(
    (j, step) => (j.stages[step].phase === "skipped" ? j : withStage(j, step, KEPT)),
    job
  );
}

// Resolves true once the final reading is on the job (and in the cache).
export async function readAsExpert(ref: JobRef): Promise<boolean> {
  const job = currentJob(ref);
  if (!job) return false;
  const cached = loadCachedAnalysis(job.storage, ref.problemId, job.statement);
  if (cached) return !!patchJob(ref, (j) => ({ ...markKept(j, "audit"), expert: cached }));

  let reading = loadJobRecord(job.storage, ref.problemId, job.statement)?.reading;
  if (reading) {
    const resumed = reading;
    patchJob(ref, (j) => ({ ...markKept(j, resumed.step), reading: resumed }));
  } else {
    const first = await request(ref, "first");
    if (!first) return false;
    if (first instanceof Error) {
      setStage(ref, "first", { phase: "error", message: first.message });
      return false;
    }
    reading = { step: "first", analysis: first.analysis };
    keep(ref, reading, DONE);
  }

  if (reading.step === "first") {
    const second = await request(ref, "second", reading);
    if (!second) return false;
    if (second instanceof Error) {
      setStage(ref, "second", { phase: "done", message: "didn't finish — kept the first reading" });
    } else {
      reading = { step: "second", analysis: second.analysis };
      keep(ref, reading, DONE);
    }
  }

  if (currentJob(ref)?.solution?.verified && reading.step !== "audit") {
    const audit = await request(ref, "audit", reading);
    if (!audit) return false;
    if (audit instanceof Error) {
      setStage(ref, "audit", { phase: "done", message: "didn't finish — kept the reading unchecked" });
    } else {
      reading = { step: "audit", analysis: audit.analysis };
      const note = audit.audit?.revised
        ? "revised after the check"
        : audit.audit?.verdict === "pass"
          ? "passed"
          : undefined;
      keep(ref, reading, { phase: "done", message: note });
    }
  }

  const final = reading.analysis;
  const landed = patchJob(ref, (j) => ({ ...j, expert: final }));
  if (!landed) return false;
  saveCachedAnalysis(landed.storage, ref.problemId, final);
  return true;
}
