import type { Chain, FeedbackCard } from "@/lib/schema";
import Card from "@/components/ui/Card";
import Tag from "@/components/ui/Tag";
import Highlight from "@/components/ui/Highlight";
import { RichTex } from "@/components/reading/Tex";
import SpanText from "@/components/reading/SpanText";

const KIND_LABEL: Record<FeedbackCard["kind"], string> = {
  near_miss: "near miss",
  missed_cue: "missed cue",
  wrong_turn: "wrong turn",
  unused_mark: "unused mark",
};

// One elaborated feedback card: the student's own evidence, the
// process-level diagnosis, the next move, the self-check. A near miss is
// the one kind that gets the red tag — it marks the student's own right
// idea, the thing most worth coming back for.
export default function FeedbackCardView({
  expert,
  card,
}: {
  expert: Chain;
  card: FeedbackCard;
}) {
  const spans = card.expert_span_ids
    .map((id) => expert.spans.find((s) => s.id === id))
    .filter((s) => s !== undefined);
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2">
        <Tag on={card.kind === "near_miss"}>{KIND_LABEL[card.kind]}</Tag>
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
      <div className="mt-1">
        <strong>Next:</strong> <RichTex tex={card.redirection} />
      </div>
      <div className="mt-1 text-[0.9375rem] text-muted">
        <strong>Self-check:</strong> <RichTex tex={card.self_check} />
      </div>
    </Card>
  );
}
