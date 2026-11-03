// The dashboard's pipeline, one job per problem, run inside the job store
// (lib/jobStore.ts) so it outlives the page that started it:
//   transcribe? -> solve -> (expert first -> second -> audit || attempt) -> explain
// The solve grounds the expert reading and is skipped when the analysis
// cache or an interrupted run's record (lib/jobRecord.ts) already holds
// it. Every stage persists what it produced in the storage the job was
// started with: the library (statement, name), the cache, the record.
// Live mode only: the demo never starts a job.

import { postJson } from "./postJson";
import { loadCachedAnalysis } from "./analysisCache";
import { autoNameProblem } from "./autoName";
import { loadJobRecord, updateJobRecord } from "./jobRecord";
import { readAsExpert } from "./jobExpert";
import { explain, finish } from "./jobFinish";
import { currentJob, getJob, patchJob, putJob, setStage, type JobRef } from "./jobStore";
import {
  DONE,
  KEPT,
  RUNNING,
  errorText,
  isRunning,
  withStage,
  type AnalysisJob,
  type AttemptOutcome,
  type JobStageKey,
  type Stage,
} from "./jobTypes";
import { loadLibrary, saveLibrary, setProblemStatement, type StoredProblem } from "./problems";
import type { PageImage } from "./pages";
import type { Solution } from "./schema";
import type { ModeStorage } from "./useAppMode";

function fail(ref: JobRef, key: JobStageKey, e: unknown): void {
  setStage(ref, key, { phase: "error", message: errorText(e) });
}

// The statement lands in the library (the problem leaves "creating") and
// the problem gets its automatic name. No readable statement is a failure,
// so the problem stays "creating" and Try again reads the pages again.
async function transcribe(ref: JobRef): Promise<boolean> {
  const job = setStage(ref, "transcribe", RUNNING);
  if (!job) return false;
  let text: string;
  try {
    const read = await postJson<{ text: string }>("/api/read", {
      purpose: "statement",
      pages: job.statementPages.map((p) => p.dataUrl),
    });
    text = read.text.trim();
  } catch (e: unknown) {
    fail(ref, "transcribe", e);
    return false;
  }
  if (text === "") {
    const unread = "No problem statement could be read from the screenshot — try a clearer image.";
    fail(ref, "transcribe", new Error(unread));
    return false;
  }
  const landed = patchJob(ref, (j) => ({ ...withStage(j, "transcribe", DONE), statement: text }));
  if (!landed) return false;
  saveLibrary(landed.storage, setProblemStatement(loadLibrary(landed.storage), ref.problemId, text));
  window.dispatchEvent(new Event("competitor:library-changed"));
  void autoNameProblem(landed.storage, ref.problemId, text);
  return true;
}

// The audit checks a reading against a verified solution only.
function withSolution(job: AnalysisJob, solution: Solution | null): AnalysisJob {
  const audit: Stage = solution?.verified ? job.stages.audit : { phase: "skipped" };
  return { ...withStage(job, "audit", audit), solution };
}

// Call S. A cached reading carries its solution and an interrupted run's
// record keeps one, so revisits and resubmits never re-solve.
async function solve(ref: JobRef): Promise<boolean> {
  const job = currentJob(ref);
  if (!job) return false;
  const cached = loadCachedAnalysis(job.storage, ref.problemId, job.statement);
  const kept = cached
    ? (cached.solution ?? null)
    : loadJobRecord(job.storage, ref.problemId, job.statement)?.solution;
  if (kept !== undefined) {
    return !!patchJob(ref, (j) => withSolution(withStage(j, "solve", KEPT), kept));
  }
  setStage(ref, "solve", RUNNING);
  let solution: Solution | null;
  try {
    ({ solution } = await postJson<{ solution: Solution | null }>("/api/solve", {
      problemText: job.statement,
    }));
  } catch (e: unknown) {
    fail(ref, "solve", e);
    return false;
  }
  const landed = patchJob(ref, (j) => withSolution(withStage(j, "solve", DONE), solution));
  if (!landed) return false;
  updateJobRecord(landed.storage, ref.problemId, landed.statement, { solution });
  return true;
}

async function readAttempt(ref: JobRef): Promise<void> {
  const job = setStage(ref, "attempt", RUNNING);
  if (!job) return;
  let outcome: AttemptOutcome;
  try {
    outcome = await postJson<AttemptOutcome>("/api/read", {
      purpose: "attempt",
      problemId: ref.problemId,
      problemText: job.statement,
      pages: job.attemptPages.map((p) => p.dataUrl),
    });
  } catch (e: unknown) {
    fail(ref, "attempt", e);
    return;
  }
  if (patchJob(ref, (j) => ({ ...withStage(j, "attempt", DONE), attempt: outcome }))) {
    finish(ref);
  }
}

async function readAsExpertThenFinish(ref: JobRef): Promise<void> {
  if (await readAsExpert(ref)) finish(ref);
}

// The analysis proper, once the statement is known. The record says a
// job is running from here on, so a reload can be told honestly.
async function analyse(ref: JobRef): Promise<void> {
  const job = currentJob(ref);
  if (!job) return;
  updateJobRecord(job.storage, ref.problemId, job.statement, { running: true });
  if (!(await solve(ref))) return;
  void readAsExpertThenFinish(ref);
  if (currentJob(ref)?.stages.attempt.phase === "pending") void readAttempt(ref);
}

async function run(ref: JobRef): Promise<void> {
  const job = currentJob(ref);
  if (!job) return;
  if (job.stages.transcribe.phase !== "skipped" && !(await transcribe(ref))) return;
  if (job.runAnalysis) await analyse(ref);
}

let tokens = 0;

// runAnalysis false = "create and solve later": transcription only. A
// problem whose job is running is left alone; any other job it had is
// replaced.
export function startJob(input: {
  storage: ModeStorage;
  problem: StoredProblem;
  statementPages: PageImage[];
  attemptPages: PageImage[];
  runAnalysis: boolean;
}): void {
  const existing = getJob(input.problem.id);
  if (existing && isRunning(existing)) return;
  const transcribing = input.statementPages.length > 0;
  const analysing: Stage = { phase: input.runAnalysis ? "pending" : "skipped" };
  const reading: Stage = {
    phase: input.runAnalysis && input.attemptPages.length > 0 ? "pending" : "skipped",
  };
  tokens += 1;
  const job: AnalysisJob = {
    token: `${Date.now().toString(36)}-${tokens}`,
    problemId: input.problem.id,
    storage: input.storage,
    startedAt: Date.now(),
    runAnalysis: input.runAnalysis,
    stages: {
      transcribe: { phase: transcribing ? "pending" : "skipped" },
      solve: analysing,
      first: analysing,
      second: analysing,
      audit: analysing,
      attempt: reading,
      explain: reading,
    },
    statementPages: input.statementPages,
    attemptPages: input.attemptPages,
    statement: transcribing ? "" : input.problem.latex.trim(),
    analysed: false,
  };
  putJob(job);
  void run({ problemId: job.problemId, token: job.token });
}

// second and audit never fail (their failure keeps the reading before
// them), so they have no retry.
export function retryStage(problemId: string, key: JobStageKey): void {
  const job = getJob(problemId);
  if (!job || job.stages[key].phase !== "error") return;
  const ref = { problemId, token: job.token };
  // A stopped job restarts its clock; a retry beside running stages keeps it.
  if (!isRunning(job)) patchJob(ref, (j) => ({ ...j, startedAt: Date.now() }));
  if (key === "transcribe") void run(ref);
  else if (key === "solve") void analyse(ref);
  else if (key === "first") void readAsExpertThenFinish(ref);
  else if (key === "attempt") void readAttempt(ref);
  else if (key === "explain") void explain(ref);
}
