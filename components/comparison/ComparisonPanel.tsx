"use client";

import type { Analysis } from "@/lib/schema";
import FirstDivergence from "@/components/comparison/FirstDivergence";
import FeedbackCardView from "@/components/comparison/FeedbackCardView";
import { RichTex } from "@/components/reading/Tex";
import UnusedCues from "@/components/comparison/UnusedCues";
import StudentMethod from "@/components/comparison/StudentMethod";
import StudentSecondReading from "@/components/comparison/StudentSecondReading";
import PageThumbnails from "@/components/comparison/PageThumbnails";
import ComparisonEmpty from "@/components/comparison/ComparisonEmpty";
import NextStep from "@/components/comparison/NextStep";
import PanelSection, { ComparisonHeading } from "@/components/comparison/PanelSection";
import type { PageImage } from "@/lib/pages";

// data null is the unsolved state; an expert-only analysis (no attempt
// extracted yet) keeps the empty state. Once the student chain is real the
// comparison renders in full, even for a near-empty attempt with no marks
// — the heading stays either way so the layout does not jump. pages are
// this session's submitted attempt pages (or a recorded example's).
// Order is a hint ladder: where the student stands, the one next step,
// then the cards (each card's own next move folded until asked for), and
// last what the student wrote themselves, folded.
export default function ComparisonPanel({
  data,
  pages,
  explain,
  attemptPhase,
}: {
  data: Analysis | null;
  pages?: PageImage[];
  // The attempt read's phase, while a job holds submitted attempt pages,
  // so the empty panel never asks for an attempt already submitted.
  attemptPhase?: string;
  // The explain stage's live state, while a job runs: the panel shows
  // the TypeScript comparison first and this line says the upgrade is
  // coming (or failed, with a retry).
  explain?: { phase: string; message?: string; onRetry: () => void };
}) {
  const attempted = !!data && (!!data.attempt_report || data.student.spans.length > 0);
  if (!data || !attempted) {
    return <ComparisonEmpty data={data} pages={pages} attemptPhase={attemptPhase} />;
  }
  const { cards, unused_cues: unused, where_you_are, where_to_next } = data.comparison;
  // Grounded readings earn the stronger note; without a verified solution
  // the humbler wording stays. Recorded examples carry the verdict alone.
  const grounded = data.grounded ?? data.solution?.verified === true;
  // The panel only ever scrolls down: long words break, and a display
  // formula too wide to fit scrolls inside its own box.
  return (
    <div className="break-words [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden px-[1.375rem] pb-7 pt-[0.875rem]">
      <ComparisonHeading />
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
      {where_you_are && (
        <p className="mt-3 text-[1.0625rem]">
          <RichTex tex={where_you_are} />
        </p>
      )}
      {where_to_next && <NextStep text={where_to_next} />}
      <div className="h-3" />
      <PanelSection title="First divergence" defaultOpen={true} first>
        <FirstDivergence text={data.comparison.first_divergence} />
      </PanelSection>
      <PanelSection title={`What to revisit · ${cards.length}`} defaultOpen={true}>
        <div className="mt-[10px] grid gap-[10px]">
          {cards.map((card) => (
            <FeedbackCardView
              key={`${card.kind}-${card.expert_span_ids.join("-")}`}
              expert={data.expert}
              card={card}
            />
          ))}
        </div>
      </PanelSection>
      {unused.length > 0 && (
        <PanelSection title={`Marked but unused · ${unused.length}`} defaultOpen={true}>
          <UnusedCues cues={unused} expert={data.expert} student={data.student} />
        </PanelSection>
      )}
      <PanelSection title="Your method" defaultOpen={false}>
        <StudentMethod student={data.student} />
      </PanelSection>
      <PanelSection title="Your second reading" defaultOpen={false}>
        <StudentSecondReading student={data.student} />
      </PanelSection>
      <PanelSection title="Your pages" defaultOpen={true}>
        <PageThumbnails pages={pages} />
      </PanelSection>
    </div>
  );
}
