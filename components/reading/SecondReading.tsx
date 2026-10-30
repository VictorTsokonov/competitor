import type { Chain } from "@/lib/schema";
import Highlight from "@/components/ui/Highlight";
import { RichTex } from "@/components/reading/Tex";
import SpanText from "@/components/reading/SpanText";

export default function SecondReading({
  second_reading,
  spans,
}: {
  second_reading: Chain["second_reading"];
  spans: Chain["spans"];
}) {
  const spanOf = (id: string) => spans.find((s) => s.id === id);
  return (
    <div>
      {second_reading.reweighted.length > 0 && (
        <p className="mb-2 mt-3">
          Weights moved:{" "}
          {second_reading.reweighted.map((r, i) => {
            const span = spanOf(r.span_id);
            return (
              <span key={r.span_id}>
                {i > 0 && "; "}
                {span ? (
                  <Highlight category={span.category} weight={r.new}>
                    <SpanText text={span.text} />
                  </Highlight>
                ) : (
                  <span className="font-bold">“{r.span_id}”</span>
                )}{" "}
                {r.old} → <strong>{r.new}</strong>
              </span>
            );
          })}
          .
        </p>
      )}
      {second_reading.new_spans.length > 0 && (
        <p className="mb-2 mt-3">
          Newly marked:{" "}
          {second_reading.new_spans.map((s, i) => (
            <span key={i}>
              {i > 0 && "; "}
              “<SpanText text={s} />”
            </span>
          ))}
          .
        </p>
      )}
      <p className={second_reading.reweighted.length > 0 || second_reading.new_spans.length > 0 ? "" : "mt-3"}>
        <RichTex tex={second_reading.what_changed} />
      </p>
    </div>
  );
}
