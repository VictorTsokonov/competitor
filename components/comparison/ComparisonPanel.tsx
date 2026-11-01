"use client";

import { useState } from "react";
import type { Analysis } from "@/lib/schema";
import FirstDivergence from "@/components/comparison/FirstDivergence";
import FeedbackCardView from "@/components/comparison/FeedbackCardView";
import { RichTex } from "@/components/reading/Tex";
import UnusedCues from "@/components/comparison/UnusedCues";
import StudentMethod from "@/components/comparison/StudentMethod";
import StudentSecondReading from "@/components/comparison/StudentSecondReading";
import PageThumbnails from "@/components/comparison/PageThumbnails";
import type { PageImage } from "@/lib/pages";

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

// data null is the unsolved state; an expert-only analysis (no attempt
// extracted yet) keeps the empty state. Once the student chain is real the
// comparison from lib/compare.ts renders in full — the heading stays
// either way so the layout does not jump. pages are this session's
// submitted attempt pages, shown while they are known.
export default function ComparisonPanel({
  data,
  pages,
  explain,
}: {
  data: Analysis | null;
  pages?: PageImage[];
  // The explain stage's live state, while a job runs: the panel shows
  // the TypeScript comparison first and this line says the upgrade is
  // coming (or failed, with a retry).
  explain?: { phase: string; message?: string; onRetry: () => void };
}) {
  if (!data || data.student.spans.length === 0) {
    const emptyText = !data
      ? "The comparison appears here after you submit your attempt."
      : data.comparison.first_divergence ||
        "Submit your attempt to see the comparison.";
    return (
      <div className="px-[1.375rem] pb-7 pt-[0.875rem]">
        <div className="flex min-h-[36px] items-center pr-[46px]">
          <span className="font-display text-[1.75rem] font-bold leading-none text-accent">
            Comparison
          </span>
        </div>
        <p className="mt-3 text-[1.0625rem] text-muted">{emptyText}</p>
        {pages && pages.length > 0 && (
          <div className="mt-4">
            <div className="text-[1.25rem] font-bold">Your pages</div>
            <PageThumbnails pages={pages} />
          </div>
        )}
      </div>
    );
  }
  const { cards, unused_cues: unused } = data.comparison;
  // Grounded readings earn the stronger note; without a verified solution
  // the humbler wording stays.
  const grounded = data.solution?.verified === true;
  return (
    <div className="px-[1.375rem] pb-7 pt-[0.875rem]">
      <div className="flex min-h-[36px] items-center pr-[46px]">
        <span className="font-display text-[1.75rem] font-bold leading-none text-accent">
          Comparison
        </span>
      </div>
      <p className="mt-1 text-[0.9375rem] text-muted">
        {grounded
          ? "The expert reading is grounded in a route the expert solved and verified on a small case. The solution itself stays private."
          : "The expert reading is a plausible narrative, not a trace of the model's thinking."}
      </p>
      {(explain?.phase === "running" || explain?.phase === "pending") && (
        <p role="status" className="mt-2 text-[0.9375rem] text-muted">
          Writing your feedback…
        </p>
      )}
      {explain?.phase === "error" && (
        <p className="mt-2 text-[0.9375rem] text-muted">
          The feedback pass failed: {explain.message}{" "}
          <button
            type="button"
            onClick={explain.onRetry}
            className="cursor-pointer underline"
          >
            Try again
          </button>
        </p>
      )}
      {data.comparison.where_you_are && (
        <p className="mt-3 text-[1.0625rem]">
          <RichTex tex={data.comparison.where_you_are} />
        </p>
      )}
      <div className="h-3" />
      <Section title="First divergence" defaultOpen={true} first>
        <FirstDivergence text={data.comparison.first_divergence} />
      </Section>
      <Section title={`What to revisit · ${cards.length}`} defaultOpen={true}>
        <div className="mt-[10px] grid gap-[10px]">
          {cards.map((card) => (
            <FeedbackCardView
              key={`${card.kind}-${card.expert_span_ids.join("-")}`}
              expert={data.expert}
              card={card}
            />
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
      {data.comparison.where_to_next && (
        <Section title="Where to next" defaultOpen={true}>
          <p className="mt-[10px] text-[1.0625rem]">
            <RichTex tex={data.comparison.where_to_next} />
          </p>
        </Section>
      )}
      <Section title="Your pages" defaultOpen={true}>
        <PageThumbnails pages={pages} />
      </Section>
    </div>
  );
}
