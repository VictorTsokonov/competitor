"use client";

import Pill from "@/components/ui/Pill";
import PipelineProgress from "@/components/create/PipelineProgress";
import { pipelineView } from "@/components/dashboard/pipelineView";
import type { AnalysisJob, JobStageKey } from "@/lib/jobTypes";

// "Create problem and solve later": this card replaces the creation form
// until dismissed. A photographed statement shows its transcription's
// progress (the job keeps going if the student moves on); a typed one is
// saved at once.
export default function CreationCard({
  job,
  onRetry,
  onOpen,
  onDismiss,
}: {
  job?: AnalysisJob;
  onRetry: (key: JobStageKey) => void;
  onOpen: () => void;
  onDismiss: () => void;
}) {
  // Ready once the statement is in: a typed one at once (no job), a
  // photographed one when its transcription lands.
  const phase = job?.stages.transcribe.phase;
  const heading =
    !job || phase === "done" || phase === "skipped"
      ? "Problem ready"
      : phase === "error"
        ? "Problem creation stopped"
        : "Problem creation in progress";
  return (
    <div>
      <h2 className="font-display text-[2.5rem] font-bold leading-none">{heading}</h2>
      {job ? (
        <PipelineProgress view={pipelineView(job, { onRetry })} />
      ) : (
        <p className="mt-4 text-[1.0625rem] text-muted">
          Saved to Sets — find it in the left panel.
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        <Pill variant="primary" onClick={onOpen} className="min-h-[42px] text-[1.0625rem]">
          Go to problem
        </Pill>
        <Pill onClick={onDismiss}>New problem</Pill>
      </div>
    </div>
  );
}
