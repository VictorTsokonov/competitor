import type { Chain } from "@/lib/schema";
import { Tex } from "@/components/StageCard";

export default function ResponseReading({
  reading,
  spans,
}: {
  reading: Chain["reading"];
  spans: Chain["spans"];
}) {
  const spanText = (id: string) =>
    spans.find((s) => s.id === id)?.text ?? id;
  return (
    <>
      <dl className="space-y-4">
        {reading.cues.map((c) => (
          <div key={c.id}>
            <dt className="font-bold">“{spanText(c.span_id)}”</dt>
            <dd className="mt-1">{c.why_it_matters}</dd>
            <dd className="mt-1 text-muted">{c.how_spotted}</dd>
          </div>
        ))}
      </dl>
      {reading.definitions.map((d) => (
        <p key={d.term}>
          <span className="font-bold">{d.term}</span>:{" "}
          <Tex tex={d.meaning_latex} />
        </p>
      ))}
    </>
  );
}
