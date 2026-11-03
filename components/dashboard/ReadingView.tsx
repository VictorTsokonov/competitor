"use client";

import Pill from "@/components/ui/Pill";
import ProblemReading from "@/components/reading/ProblemReading";
import AttemptNotice, { type AttemptCallState } from "@/components/reading/AttemptNotice";
import ExpertStages from "@/components/reading/ExpertStages";
import { isRunning, type AnalysisJob } from "@/lib/jobTypes";
import type { Analysis } from "@/lib/schema";

// Call C's state for the notice under the reading, from the job.
function attemptCallState(job?: AnalysisJob): AttemptCallState {
  const stage = job?.stages.attempt;
  if (job && (stage?.phase === "running" || stage?.phase === "pending")) {
    return { phase: "loading", pageCount: job.attemptPages.length };
  }
  if (stage?.phase === "error") {
    return { phase: "error", message: stage.message ?? "request failed" };
  }
  return { phase: "idle" };
}

// A problem with its expert reading: the layered statement, call C's
// state and structure notice, the eight stages, and Re-analyse once no
// job runs. When the attempt could not be read, the notice offers a
// retry and Start over goes back to the attempt form (to change the
// pages) with the expert's reading kept.
export default function ReadingView({
  analysis,
  label,
  note,
  job,
  demo,
  onRetryAttempt,
  onStartOver,
  onReanalyse,
}: {
  analysis: Analysis;
  label: string;
  note?: string;
  job?: AnalysisJob;
  demo: boolean;
  onRetryAttempt: () => void;
  onStartOver: () => void;
  onReanalyse: () => void;
}) {
  const state = attemptCallState(job);
  return (
    <>
      <ProblemReading data={analysis} label={label} note={note} />
      <div className="mt-[26px]">
        <AttemptNotice
          state={state}
          report={analysis.attempt_report}
          onRetry={state.phase === "error" ? onRetryAttempt : undefined}
        />
        {state.phase === "error" && (
          <div className="mb-[26px] flex flex-wrap items-center gap-x-4 gap-y-2">
            <Pill onClick={onStartOver} className="min-h-[38px] text-[1rem]">
              Start over
            </Pill>
            <span className="text-[0.9375rem] text-muted">
              Back to your attempt to change the pages; the expert&apos;s
              reading is kept.
            </span>
          </div>
        )}
      </div>
      <ExpertStages expert={analysis.expert} />
      {!(job && isRunning(job)) && !demo && (
        <div className="mt-[30px]">
          <Pill onClick={onReanalyse} className="min-h-[42px] text-[1.0625rem]">
            Re-analyse from scratch
          </Pill>
          <p className="mt-2 text-[0.9375rem] text-muted">
            Clears this reading; resubmit your attempt to run the whole
            pipeline again.
          </p>
        </div>
      )}
    </>
  );
}
