"use client";

import { useEffect, useState } from "react";
import Pill from "@/components/ui/Pill";
import type { JobStageKey, Stage } from "@/lib/useAnalysisJob";

export type PipelineView = {
  startedAt: number;
  stages: {
    key: JobStageKey;
    label: string;
    stage: Stage;
    onRetry?: () => void;
  }[];
};

// Measured on the fixtures (1 Nov): statement read ~15s, solve+verify
// ~30-170s, expert pass with second reading ~50s, attempt read ~30s,
// feedback ~25s; expert and attempt run in parallel, after the solve.
const ESTIMATE_S = {
  transcribe: 15,
  solve: 75,
  expert: 50,
  attempt: 30,
  explain: 25,
} as const;

function estimateSeconds(view: PipelineView): number {
  const open = (key: keyof typeof ESTIMATE_S) =>
    view.stages.some(
      (s) => s.key === key && (s.stage.phase === "pending" || s.stage.phase === "running")
    );
  return (
    (open("transcribe") ? ESTIMATE_S.transcribe : 0) +
    (open("solve") ? ESTIMATE_S.solve : 0) +
    Math.max(open("expert") ? ESTIMATE_S.expert : 0, open("attempt") ? ESTIMATE_S.attempt : 0) +
    (open("explain") ? ESTIMATE_S.explain : 0)
  );
}

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
        {label}
        {stage.phase === "running" && <span className="text-muted"> …</span>}
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
  const running = view.stages.some(
    (s) => s.stage.phase === "running" || s.stage.phase === "pending"
  );
  const elapsed = Math.max(0, Math.round((now - view.startedAt) / 1000));
  const estimate = estimateSeconds(view);
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
        <span role="status" className="text-[1.0625rem] text-muted">
          {running
            ? `usually about ${estimate}s more · ${elapsed}s elapsed`
            : "done"}
        </span>
      </div>
      <ul className="grid list-none gap-2 p-0">
        {view.stages.map((s) => (
          <StageRow key={s.key} label={s.label} stage={s.stage} onRetry={s.onRetry} />
        ))}
      </ul>
    </div>
  );
}
