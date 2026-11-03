"use client";

import { useEffect, useState } from "react";
import Pill from "@/components/ui/Pill";
import type { JobStageKey, Stage } from "@/lib/jobTypes";

export type PipelineView = {
  startedAt: number;
  stages: {
    key: JobStageKey;
    label: string;
    stage: Stage;
    // Running, or waiting with nothing it depends on failed.
    open: boolean;
    onRetry?: () => void;
  }[];
  // A failure stopped the job before its final reading: back to the
  // attempt form, keeping the private solution and any finished expert
  // reading (the attempt is read again).
  onStartOver?: () => void;
};

// Typical seconds per stage, measured 3 Nov on live runs with the
// plain-language prompts (a browser run through /api/expert, two scripted
// runs, and the request trace of earlier runs). A solve that fails its
// check and re-solves can take about four minutes. The expert's three
// steps run one after another, alongside the attempt read; everything
// else runs in sequence.
const ESTIMATE_S: Record<JobStageKey, number> = {
  transcribe: 12,
  solve: 90,
  first: 160,
  second: 65,
  audit: 90,
  attempt: 85,
  explain: 60,
};

function estimateSeconds(view: PipelineView): number {
  const open = (key: JobStageKey) =>
    view.stages.some((s) => s.key === key && s.open) ? ESTIMATE_S[key] : 0;
  return (
    open("transcribe") +
    open("solve") +
    Math.max(open("first") + open("second") + open("audit"), open("attempt")) +
    open("explain")
  );
}

// "45 s" under a minute, then "2 min 10 s"; rough rounds to whole minutes.
function duration(seconds: number, rough = false): string {
  if (seconds < 60) return `${seconds} s`;
  const minutes = rough ? Math.round(seconds / 60) : Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rough || rest === 0 ? `${minutes} min` : `${minutes} min ${rest} s`;
}

// Each stage's state in words for screen readers; sighted readers get the
// tick, the muted colour and the trailing " …".
const STATE_WORD: Record<Exclude<Stage["phase"], "skipped">, string> = {
  pending: "waiting",
  running: "running",
  done: "done",
  error: "failed",
};

function StageRow({
  label,
  stage,
  onRetry,
}: {
  label: string;
  stage: Stage;
  onRetry?: () => void;
}) {
  if (stage.phase === "skipped") return null;
  return (
    <li className="flex items-start gap-[10px] text-[1.125rem]">
      <span className="w-6 flex-none text-center font-bold" aria-hidden="true">
        {stage.phase === "done" ? "✓" : stage.phase === "error" ? "·" : ""}
      </span>
      <span className={stage.phase === "pending" ? "text-muted" : ""}>
        <span className="sr-only">{STATE_WORD[stage.phase]}: </span>
        {label}
        {stage.phase === "running" && <span className="text-muted"> …</span>}
        {stage.phase === "done" && stage.message && (
          <span className="text-muted"> · {stage.message}</span>
        )}
        {stage.phase === "error" && (
          <>
            <span className="text-muted"> — {stage.message}</span>
            {onRetry && (
              <Pill onClick={onRetry} className="ml-3 min-h-[32px] text-[0.9375rem]">
                Try again
              </Pill>
            )}
          </>
        )}
      </span>
    </li>
  );
}

// The C∅ loader: the empty set rotates while stages run. Never one long
// spinner — each stage reports itself, with an honest estimate and the
// elapsed time, and results render the moment their stage lands.
export default function PipelineProgress({ view }: { view: PipelineView }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const running = view.stages.some((s) => s.open);
  const failed = view.stages.some((s) => s.stage.phase === "error");
  const elapsed = Math.max(0, Math.round((now - view.startedAt) / 1000));
  // Only the stage-driven part is a live region: the clock ticks every
  // second and would be announced every second.
  const status = running ? "" : failed ? "stopped — a step failed" : "done";
  const timing = running
    ? `usually about ${duration(estimateSeconds(view), true)} more · ${duration(elapsed)} elapsed`
    : "";
  return (
    <div className="my-[30px] rounded-[0.625rem] border-2 border-dashed border-rule bg-card/60 p-6">
      <div className="mb-4 flex items-center gap-4">
        <span
          aria-hidden="true"
          className="flex-none whitespace-nowrap font-display text-[3rem] font-bold leading-none"
        >
          C
          <span
            className={`inline-block text-accent ${
              running ? "animate-[spin_2.6s_linear_infinite]" : ""
            }`}
          >
            ∅
          </span>
        </span>
        <span className="text-[1.0625rem] text-muted">
          <span role="status">
            {running ? <span className="sr-only">Analysis running.</span> : status}
          </span>
          {timing}
        </span>
      </div>
      <ul className="grid list-none gap-2 p-0">
        {view.stages.map((s) => (
          <StageRow key={s.key} label={s.label} stage={s.stage} onRetry={s.onRetry} />
        ))}
      </ul>
      {view.onStartOver && (
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Pill onClick={view.onStartOver} className="min-h-[38px] text-[1rem]">
            Start over
          </Pill>
          <span className="text-[0.9375rem] text-muted">
            Back to your attempt. The private solution and any finished
            expert reading are kept; your pages are read again.
          </span>
        </div>
      )}
    </div>
  );
}
