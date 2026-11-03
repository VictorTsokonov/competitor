"use client";

import PipelineProgress from "@/components/create/PipelineProgress";
import ProblemHeading from "@/components/dashboard/ProblemHeading";
import ReadingView from "@/components/dashboard/ReadingView";
import UnsolvedView, { type AttemptForm } from "@/components/dashboard/UnsolvedView";
import { pipelineView } from "@/components/dashboard/pipelineView";
import { hasError, isRunning, type AnalysisJob, type JobStageKey } from "@/lib/jobTypes";
import type { StoredProblem } from "@/lib/problems";
import type { Analysis } from "@/lib/schema";

// The centre for a selected problem, by where it stands: its job's
// progress card until the final expert reading lands (or while a failure
// waits for a retry), then the reading; with no job, an orphaned
// transcription's honest message, an analysed problem's loading line, or
// the Unsolved statement with its attempt form.
export default function ProblemCentre({
  problem,
  label,
  analysis,
  job,
  demo,
  status,
  interrupted,
  attempt,
  onRetry,
  onStartOver,
  onReanalyse,
}: {
  problem: StoredProblem;
  label: string;
  analysis: Analysis | null;
  job?: AnalysisJob;
  demo: boolean;
  // An analysed problem's loading line, or why it failed to load.
  status: string | null;
  interrupted: { kept: string[] } | null;
  attempt: AttemptForm;
  onRetry: (key: JobStageKey) => void;
  onStartOver: () => void;
  onReanalyse: () => void;
}) {
  if (job && !job.expert && (isRunning(job) || hasError(job) || problem.state === "creating")) {
    return (
      <div>
        <ProblemHeading name={problem.name} statement={problem.latex} />
        <PipelineProgress view={pipelineView(job, { onRetry, onStartOver })} />
      </div>
    );
  }
  if (analysis) {
    return (
      <ReadingView
        analysis={analysis}
        label={label}
        job={job}
        demo={demo}
        onRetryAttempt={() => onRetry("attempt")}
        onStartOver={onStartOver}
        onReanalyse={onReanalyse}
      />
    );
  }
  if (problem.state === "creating") {
    return (
      <div>
        <ProblemHeading name={problem.name} statement="" />
        <p role="status" className="mt-4 text-[1.0625rem] text-muted">
          The statement never finished being read — the page was closed
          mid-creation. Delete this problem in the Sets panel and create it
          again.
        </p>
      </div>
    );
  }
  if (problem.state === "analysed") {
    return (
      <div>
        <ProblemHeading name={problem.name} statement={problem.latex} />
        <p role="status" className="text-[1.0625rem] text-muted">
          {status ?? "Loading analysis…"}
        </p>
      </div>
    );
  }
  return (
    <UnsolvedView problem={problem} demo={demo} interrupted={interrupted} attempt={attempt} />
  );
}
