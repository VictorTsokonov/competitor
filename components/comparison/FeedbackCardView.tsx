"use client";

import { useState } from "react";
import type { Chain, FeedbackCard } from "@/lib/schema";
import Card from "@/components/ui/Card";
import Tag from "@/components/ui/Tag";
import Highlight from "@/components/ui/Highlight";
import { RichTex } from "@/components/reading/Tex";
import SpanText from "@/components/reading/SpanText";

// Each kind's tag, and the plain-words tooltip that says what it means.
const KIND: Record<FeedbackCard["kind"], { label: string; hint: string }> = {
  near_miss: {
    label: "near miss",
    hint: "The right idea is already on your pages, and you let it go.",
  },
  wrong_turn: {
    label: "wrong turn",
    hint: "The route you kept cannot reach the answer as it stands.",
  },
  missed_cue: {
    label: "missed cue",
    hint: "A phrase the expert leans on that your pages never touch.",
  },
  unused_mark: {
    label: "unused mark",
    hint: "Something you marked that none of your methods used.",
  },
};

// The card prints its own "Next:" / "Self-check:" labels; a model that
// wrote the label into the field as well would show it twice.
function withoutLabel(text: string, label: string): string {
  return text.replace(new RegExp(`^\\s*\\**${label}\\**\\s*:\\**\\s*`, "i"), "");
}

// One elaborated feedback card: the student's own evidence and the
// process-level diagnosis, then — only when the student asks, so they try
// first — the next move and the self-check. A near miss is the one kind
// that gets the red tag: it marks the student's own right idea, the thing
// most worth coming back for.
export default function FeedbackCardView({
  expert,
  card,
}: {
  expert: Chain;
  card: FeedbackCard;
}) {
  const [revealed, setRevealed] = useState(false);
  const kind = KIND[card.kind];
  const spans = card.expert_span_ids
    .map((id) => expert.spans.find((s) => s.id === id))
    .filter((s) => s !== undefined);
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2">
        <span title={kind.hint} className="cursor-help">
          <Tag on={card.kind === "near_miss"}>{kind.label}</Tag>
          <span className="sr-only">: {kind.hint}</span>
        </span>
        {spans.map((s) => (
          <Highlight key={s.id} category={s.category} weight={s.weight}>
            <SpanText text={s.text} />
          </Highlight>
        ))}
      </div>
      <p className="mt-2 italic text-muted">
        <RichTex tex={card.evidence_student} />
      </p>
      <div className="mt-1">
        <RichTex tex={card.diagnosis} />
      </div>
      {revealed ? (
        <>
          <div className="mt-1">
            <strong>Next:</strong> <RichTex tex={withoutLabel(card.redirection, "Next")} />
          </div>
          <div className="mt-1 text-[0.9375rem] text-muted">
            <strong>Self-check:</strong>{" "}
            <RichTex tex={withoutLabel(card.self_check, "Self-check")} />
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="mt-2 cursor-pointer text-[0.9375rem] font-bold underline"
        >
          Tried it? Show the next move
        </button>
      )}
    </Card>
  );
}
