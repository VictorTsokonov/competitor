"use client";

import Link from "next/link";
import Pill from "@/components/ui/Pill";
import type { AttemptReport, GuideStage } from "@/lib/schema";

export type AttemptCallState =
  | { phase: "idle" }
  | { phase: "loading"; pageCount: number }
  | { phase: "error"; message: string };

function stageList(stages: GuideStage[]): string {
  return stages.join(", ");
}

// Per-call state for call C plus the calm structure notice. Not an error
// and not red: an attempt that skipped the guide's headings still gets a
// full reading, just a less precise one, and the notice says only that.
export default function AttemptNotice({
  state,
  report,
  onRetry,
}: {
  state: AttemptCallState;
  report?: AttemptReport;
  onRetry?: () => void;
}) {
  if (state.phase === "loading") {
    return (
      <p role="status" className="mb-[26px] text-[1.0625rem] text-muted">
        Reading your attempt… ({state.pageCount} page
        {state.pageCount === 1 ? "" : "s"})
      </p>
    );
  }
  if (state.phase === "error") {
    return (
      <div className="mb-[26px] rounded-[0.625rem] border-2 border-dashed border-rule bg-card/60 p-4 text-[1.0625rem]">
        <p className="text-muted">Your attempt couldn&apos;t be read: {state.message}</p>
        {onRetry && (
          <Pill onClick={onRetry} className="mt-3 min-h-[38px] text-[1rem]">
            Try reading it again
          </Pill>
        )}
      </div>
    );
  }
  if (!report) return null;
  const unguided = report.structure !== "guided";
  if (!unguided && report.legibility.length === 0) return null;
  return (
    <div className="mb-[26px] rounded-[0.625rem] border-2 border-dashed border-rule bg-card/60 p-4 text-[1.0625rem]">
      {unguided && (
        <>
          <p>
            Your working didn&apos;t follow the{" "}
            <Link href="/guide" className="underline">
              guide&apos;s five stages
            </Link>
            , so some were inferred from it — the feedback may be less
            precise.
          </p>
          <p className="mt-1 text-[0.9375rem] text-muted">
            {report.inferred_stages.length > 0 && (
              <>Inferred from the working: {stageList(report.inferred_stages)}. </>
            )}
            {report.missing_stages.length > 0 && (
              <>No evidence on the pages for: {stageList(report.missing_stages)}.</>
            )}
          </p>
        </>
      )}
      {report.legibility.length > 0 && (
        <div className={`text-[0.9375rem] text-muted ${unguided ? "mt-2" : ""}`}>
          Hard to read:
          <ul className="mt-1 list-disc pl-5">
            {report.legibility.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
