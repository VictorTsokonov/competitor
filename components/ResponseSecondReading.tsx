import type { Chain } from "@/lib/schema";

export default function ResponseSecondReading({
  second_reading,
  spans,
}: {
  second_reading: Chain["second_reading"];
  spans: Chain["spans"];
}) {
  const spanText = (id: string) =>
    spans.find((s) => s.id === id)?.text ?? id;
  return (
    <>
      {second_reading.new_spans.length > 0 && (
        <ul className="list-disc space-y-2 pl-5">
          {second_reading.new_spans.map((s, i) => (
            <li key={i}>
              <span className="font-bold">New: </span>“{s}”
            </li>
          ))}
        </ul>
      )}
      {second_reading.reweighted.length > 0 && (
        <ul className="list-disc space-y-2 pl-5">
          {second_reading.reweighted.map((r, i) => (
            <li key={i}>
              <span className="font-bold">“{spanText(r.span_id)}”</span>
              <span>
                {" "}
                {r.old} → {r.new}: {r.why}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p>{second_reading.what_changed}</p>
    </>
  );
}
