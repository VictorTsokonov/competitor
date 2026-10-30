import type { Chain, MissedCue } from "@/lib/schema";
import Card from "@/components/ui/Card";
import Highlight from "@/components/ui/Highlight";
import { RichTex } from "@/components/reading/Tex";
import SpanText from "@/components/reading/SpanText";

export default function MissedCueCard({
  expert,
  cue,
}: {
  expert: Chain;
  cue: MissedCue;
}) {
  const span = expert.spans.find((s) => s.id === cue.span_id);
  return (
    <Card>
      <div>
        <span className="font-bold text-accent">✗</span>{" "}
        {span ? (
          <Highlight category={span.category} weight={span.weight}>
            <SpanText text={span.text} />
          </Highlight>
        ) : (
          <span className="font-bold">{cue.span_id}</span>
        )}
      </div>
      <div className="mt-1">
        <RichTex tex={cue.what_it_unlocks} />
      </div>
      <div className="mt-1 text-[0.9375rem] text-muted">
        <strong>Self-check:</strong> <RichTex tex={cue.self_check} />
      </div>
    </Card>
  );
}
