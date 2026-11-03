"use client";

import Pill from "@/components/ui/Pill";
import AttemptSection from "@/components/create/AttemptSection";
import DemoNote from "@/components/create/DemoNote";
import ProblemHeading from "@/components/dashboard/ProblemHeading";
import type { PageImage } from "@/lib/pages";
import type { StoredProblem } from "@/lib/problems";

export type AttemptForm = {
  pages: PageImage[];
  onPages: (pages: PageImage[]) => void;
  onSubmit: () => void;
  // The submit's own message ("Add at least one page…").
  status: string | null;
};

function interruptedText(kept: string[]): string {
  const cut =
    "The last analysis stopped before it finished — the page was reloaded or closed.";
  return kept.length > 0
    ? `${cut} Finished stages are kept (${kept.join(", ")}), so resubmitting your pages runs only what is left.`
    : `${cut} Nothing had finished yet, so resubmitting your pages runs it from the start.`;
}

// An Unsolved problem: its statement and the inline attempt form, which
// takes pasted screenshots too (the demo shows its note instead). When
// the last analysis was cut off by a reload or a closed tab, a calm note
// says so and what was kept.
export default function UnsolvedView({
  problem,
  demo,
  interrupted,
  attempt,
}: {
  problem: StoredProblem;
  demo: boolean;
  interrupted: { kept: string[] } | null;
  attempt: AttemptForm;
}) {
  return (
    <div>
      <ProblemHeading name={problem.name} statement={problem.latex} />
      {demo ? (
        <DemoNote />
      ) : (
        <>
          {interrupted && (
            <p className="mb-[26px] text-[1.0625rem] text-muted">
              {interruptedText(interrupted.kept)}
            </p>
          )}
          <AttemptSection pages={attempt.pages} onPages={attempt.onPages} acceptPaste />
          <Pill
            variant="primary"
            onClick={attempt.onSubmit}
            className="min-h-[42px] text-[1.0625rem]"
          >
            Submit attempt
          </Pill>
          {attempt.status && (
            <p role="status" className="mt-3 text-[1.0625rem] text-muted">
              {attempt.status}
            </p>
          )}
        </>
      )}
    </div>
  );
}
