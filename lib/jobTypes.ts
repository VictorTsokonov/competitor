// The shape of one pipeline job. The dashboard runs one per problem, side
// by side (lib/jobStore.ts holds them, lib/jobPipeline.ts drives them):
//   transcribe? -> solve -> (first -> second -> audit || attempt) -> explain
// Each stage reports its own phase; results land on the job as they come.

import type { Analysis, AttemptReport, Chain, Comparison, Solution } from "./schema";
import type { PageImage } from "./pages";
import type { ExpertStep } from "./providers/types";
import type { ModeStorage } from "./useAppMode";

export type StagePhase = "skipped" | "pending" | "running" | "done" | "error";
// message: the error, or a muted note on a done stage ("kept the first reading").
export type Stage = { phase: StagePhase; message?: string };

export const STAGE_KEYS = [
  "transcribe",
  "solve",
  "first",
  "second",
  "audit",
  "attempt",
  "explain",
] as const;
export type JobStageKey = (typeof STAGE_KEYS)[number];

export const RUNNING: Stage = { phase: "running" };
export const DONE: Stage = { phase: "done" };
// A stage an earlier run finished: the cache or the job record held it.
export const KEPT: Stage = { phase: "done", message: "kept from the last run" };

export type AttemptOutcome = { student: Chain; report: AttemptReport };

export type ExpertReading = { step: ExpertStep; analysis: Analysis };

export type AnalysisJob = {
  // Fresh per start: a request that lands after its job was replaced or
  // cleared finds another token and changes nothing.
  token: string;
  problemId: string;
  storage: ModeStorage;
  startedAt: number;
  // false: "create and solve later", the job only transcribes.
  runAnalysis: boolean;
  stages: Record<JobStageKey, Stage>;
  statementPages: PageImage[];
  attemptPages: PageImage[];
  // "" until a photographed statement has been transcribed.
  statement: string;
  // Call S's result; null proceeds ungrounded. Never rendered.
  solution?: Solution | null;
  // The latest expert step's reading. Kept, never rendered, so the reading
  // does not change under the student's eyes.
  reading?: ExpertReading;
  // The final expert reading: the one the dashboard renders.
  expert?: Analysis;
  attempt?: AttemptOutcome;
  explain?: Comparison;
  // The problem has turned Analysed (and its job record is gone).
  analysed: boolean;
};

// The stages each one waits on. second and audit never error (a failure
// keeps the reading before them), so no stage waits on them.
const WAITS_ON: Record<JobStageKey, JobStageKey[]> = {
  transcribe: [],
  solve: ["transcribe"],
  first: ["transcribe", "solve"],
  second: ["transcribe", "solve", "first"],
  audit: ["transcribe", "solve", "first"],
  attempt: ["transcribe", "solve"],
  explain: ["transcribe", "solve", "first", "attempt"],
};

// Running, or pending with nothing it waits on failed. A stage stuck
// behind an error is not open: it blocks nothing until that is retried.
export function isOpen(job: AnalysisJob, key: JobStageKey): boolean {
  const { phase } = job.stages[key];
  if (phase === "running") return true;
  return phase === "pending" && !WAITS_ON[key].some((k) => job.stages[k].phase === "error");
}

export function isRunning(job: AnalysisJob): boolean {
  return STAGE_KEYS.some((key) => isOpen(job, key));
}

export function hasError(job: AnalysisJob): boolean {
  return STAGE_KEYS.some((key) => job.stages[key].phase === "error");
}

// A job keeps a record (lib/jobRecord.ts) once its statement is known and
// until its problem turns Analysed; transcription-only jobs keep none.
export function keepsRecord(job: AnalysisJob): boolean {
  return job.runAnalysis && job.statement.trim() !== "" && !job.analysed;
}

export function withStage(job: AnalysisJob, key: JobStageKey, stage: Stage): AnalysisJob {
  return { ...job, stages: { ...job.stages, [key]: stage } };
}

export function errorText(e: unknown): string {
  return e instanceof Error ? e.message : "request failed";
}
