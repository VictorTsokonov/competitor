"use client";

import { useState } from "react";
import type { Analysis } from "@/lib/schema";
import FirstDivergence from "@/components/comparison/FirstDivergence";
import MissedCueCard from "@/components/comparison/MissedCueCard";
import UnusedCues from "@/components/comparison/UnusedCues";
import StudentMethod from "@/components/comparison/StudentMethod";
import StudentSecondReading from "@/components/comparison/StudentSecondReading";
import PageThumbnails from "@/components/comparison/PageThumbnails";
import RevealButton from "@/components/comparison/RevealButton";

function Section({
  title,
  defaultOpen,
  first,
  children,
}: {
  title: string;
  defaultOpen: boolean;
  first?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={first ? "py-[14px]" : "border-t-2 border-dashed border-rule py-[14px]"}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-baseline justify-between text-left text-[1.25rem] font-bold"
      >
        {title}
        <span aria-hidden="true" className="text-muted">
          {open ? "–" : "+"}
        </span>
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

export default function ComparisonPanel({ data }: { data: Analysis }) {
  const missed = data.comparison.missed_cues;
  const unused = data.comparison.unused_cues;
  return (
    <div className="px-[1.375rem] pb-7 pt-[0.875rem]">
      <div className="flex min-h-[36px] items-center pr-[46px]">
        <span className="font-display text-[1.75rem] font-bold leading-none text-accent">
          Comparison
        </span>
      </div>
      <div className="h-3" />
      <Section title="First divergence" defaultOpen={true} first>
        <FirstDivergence text={data.comparison.first_divergence} />
      </Section>
      <Section title={`Missed cues · ${missed.length}`} defaultOpen={true}>
        <div className="mt-[10px] grid gap-[10px]">
          {missed.map((cue) => (
            <MissedCueCard key={cue.span_id} expert={data.expert} cue={cue} />
          ))}
        </div>
      </Section>
      <Section title={`Marked but unused · ${unused.length}`} defaultOpen={true}>
        <UnusedCues cues={unused} expert={data.expert} student={data.student} />
      </Section>
      <Section title="Your method" defaultOpen={true}>
        <StudentMethod student={data.student} />
      </Section>
      <Section title="Your second reading" defaultOpen={false}>
        <StudentSecondReading student={data.student} />
      </Section>
      <Section title="Your pages" defaultOpen={true}>
        <PageThumbnails />
      </Section>
      <RevealButton />
    </div>
  );
}
