"use client";

import { useState } from "react";
import type { Analysis, Chain } from "@/lib/schema";
import ProblemText from "@/components/ProblemText";
import { CategoryLegend } from "@/components/Heatmap";

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

function findSpan(expert: Chain, entry: string) {
  const cue = expert.reading.cues.find((c) => c.id === entry);
  const byCue = cue && expert.spans.find((s) => s.id === cue.span_id);
  if (byCue) return byCue;
  return expert.spans.find((s) => s.text === entry);
}

export default function ComparisonPanel({ data }: { data: Analysis }) {
  const [showSolution, setShowSolution] = useState(false);
  const expert = data.expert;

  return (
    <div className="w-80 shrink-0 px-5 py-4">
      <Details title="First divergence" defaultOpen={true}>
        <p className="border-l-[3px] border-accent pl-3">
          {data.comparison.first_divergence}
        </p>
      </Details>
      <Details title="Missed cues" defaultOpen={true}>
        <ul className="space-y-2 text-sm">
          {data.comparison.missed_cues.map((entry) => {
            const span = findSpan(expert, entry);
            return (
              <li key={entry} className="flex items-start gap-2">
                {span && (
                  <span
                    aria-hidden="true"
                    className="mt-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: `rgb(var(--cat-${span.category}))` }}
                  />
                )}
                {span?.text ?? entry}
              </li>
            );
          })}
        </ul>
      </Details>
      <Details title="Expert reading" defaultOpen={false}>
        <ProblemText text={data.problem.text} spans={expert.spans} className="text-sm" />
      </Details>
      <Details title="Your reading" defaultOpen={false}>
        <ProblemText text={data.problem.text} spans={data.student.spans} className="text-sm" />
      </Details>
      <Details title="Legend" defaultOpen={false}>
        <CategoryLegend />
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
