// The progress card's view of a job: each stage in pipeline order with
// what the student reads for it and its retry, plus Start over when a
// failure came before the final reading (and the statement is known, so
// the attempt form has something to show). Starting over drops whatever
// is still in flight; the solution and expert steps that finished stay in
// the job's record, while the attempt is read again.

import type { PipelineView } from "@/components/create/PipelineProgress";
import {
  STAGE_KEYS,
  hasError,
  isOpen,
  type AnalysisJob,
  type JobStageKey,
} from "@/lib/jobTypes";

const LABELS: Record<Exclude<JobStageKey, "attempt">, string> = {
  transcribe: "Reading the problem from your screenshot",
  solve: "Expert is solving the problem — kept private, it grounds the reading",
  first: "Expert's first reading of the problem",
  second: "Expert's second reading — re-weighing what matters",
  audit: "Checking the reading against the verified solution",
  explain: "Writing your feedback",
};

function stageLabel(job: AnalysisJob, key: JobStageKey): string {
  if (key !== "attempt") return LABELS[key];
  const pages = job.attemptPages.length;
  return `Reading your attempt (${pages} page${pages === 1 ? "" : "s"})`;
}

export function pipelineView(
  job: AnalysisJob,
  actions: { onRetry: (key: JobStageKey) => void; onStartOver?: () => void }
): PipelineView {
  const failed = hasError(job) && !job.expert && job.statement !== "";
  return {
    startedAt: job.startedAt,
    stages: STAGE_KEYS.map((key) => ({
      key,
      label: stageLabel(job, key),
      stage: job.stages[key],
      open: isOpen(job, key),
      onRetry: () => actions.onRetry(key),
    })),
    onStartOver: failed ? actions.onStartOver : undefined,
  };
}
