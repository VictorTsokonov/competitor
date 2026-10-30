"use client";

import { useState } from "react";
import type { Analysis, Chain, MissedCue } from "@/lib/schema";
import LayeredReading, { LayerLegend } from "@/components/LayeredReading";
import ResponseSecondReading from "@/components/ResponseSecondReading";
import { STAGE_SOURCES } from "@/lib/stage-sources";

function Details({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-line py-4">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between text-left font-semibold"
      >
        {title}
        <span aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

function MissedCueItem({ expert, cue }: { expert: Chain; cue: MissedCue }) {
  const span = expert.spans.find((s) => s.id === cue.span_id);
  return (
    <li className="flex items-start gap-2">
      {span && (
        <span
          aria-hidden="true"
          className="mt-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: `rgb(var(--cat-${span.category}))` }}
        />
      )}
      <div>
        <p className="font-semibold">{span?.text ?? cue.span_id}</p>
        <p className="mt-1">{cue.what_it_unlocks}</p>
        <p className="mt-1 text-muted">
          <span className="font-semibold">Ask yourself: </span>
          {cue.self_check}
        </p>
      </div>
    </li>
  );
}

export default function ComparisonPanel({ data }: { data: Analysis }) {
  const [showSolution, setShowSolution] = useState(false);
  const expert = data.expert;
  const studentSecond = data.student.second_reading;
  const hasStudentSecond =
    studentSecond.what_changed.length > 0 ||
    studentSecond.new_spans.length > 0 ||
    studentSecond.reweighted.length > 0;

  return (
    <div className="w-80 shrink-0 px-5 py-4">
      <Details title="First divergence" defaultOpen={true}>
        <p className="border-l-[3px] border-accent pl-3">
          {data.comparison.first_divergence}
        </p>
      </Details>
      <Details title="Missed cues" defaultOpen={true}>
        <ul className="space-y-4 text-sm">
          {data.comparison.missed_cues.map((cue) => (
            <MissedCueItem key={cue.span_id} expert={expert} cue={cue} />
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">
          Source: {STAGE_SOURCES.divergence.cite} —{" "}
          {STAGE_SOURCES.divergence.note}
        </p>
      </Details>
      <Details title="Marked but unused" defaultOpen={true}>
        <p className="text-sm text-muted">
          You marked these but never used them.
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {data.comparison.unused_cues.map((entry) => (
            <li key={entry}>{entry}</li>
          ))}
        </ul>
      </Details>
      <Details title="Shared reading" defaultOpen={true}>
        <LayeredReading
          text={data.problem.text}
          expertSpans={expert.spans}
          studentSpans={data.student.spans}
        />
      </Details>
      {hasStudentSecond && (
        <Details title="What changed in your reading" defaultOpen={true}>
          <div className="text-sm">
            <ResponseSecondReading
              second_reading={studentSecond}
              spans={data.student.spans}
            />
          </div>
        </Details>
      )}
      <Details title="Legend" defaultOpen={false}>
        <LayerLegend />
      </Details>
      <button
        onClick={() => setShowSolution((v) => !v)}
        className="mt-4 w-full rounded-[16px] bg-accent px-4 py-2 text-sm font-semibold text-white"
      >
        Reveal solution
      </button>
      {showSolution && (
        <p className="mt-3 text-sm text-muted">
          Full solution reveal coming soon.
        </p>
      )}
    </div>
  );
}
