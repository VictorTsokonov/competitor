import type { Analysis } from "@/lib/schema";
import type { PageImage } from "@/lib/pages";
import PageThumbnails from "@/components/comparison/PageThumbnails";
import { ComparisonHeading } from "@/components/comparison/PanelSection";

// What the empty panel says while a submitted attempt is on its way.
function pendingText(attemptPhase: string): string {
  if (attemptPhase === "error") {
    return "Your attempt could not be read — try again from the centre panel.";
  }
  if (attemptPhase === "done") {
    return "Your attempt has been read — the comparison appears once the expert reading is in.";
  }
  return "Your attempt is being read — the comparison appears once it and the expert reading are in.";
}

// The panel before there is a student chain to compare: unsolved, or an
// expert-only analysis, or an attempt still being read.
export default function ComparisonEmpty({
  data,
  pages,
  attemptPhase,
}: {
  data: Analysis | null;
  pages?: PageImage[];
  attemptPhase?: string;
}) {
  const pending = attemptPhase && !(attemptPhase === "done" && data);
  const emptyText = pending
    ? pendingText(attemptPhase)
    : !data
      ? "The comparison appears here after you submit your attempt."
      : data.comparison.first_divergence || "Submit your attempt to see the comparison.";
  return (
    <div className="px-[1.375rem] pb-7 pt-[0.875rem]">
      <ComparisonHeading />
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
