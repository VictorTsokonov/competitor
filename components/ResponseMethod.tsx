import type { Chain } from "@/lib/schema";

export default function ResponseMethod({
  method,
  spans,
}: {
  method: Chain["method"];
  spans: Chain["spans"];
}) {
  const spanText = (id: string) =>
    spans.find((s) => s.id === id)?.text ?? id;
  return (
    <>
      <ul className="space-y-4">
        {method.candidates.map((c) => (
          <li key={c.name}>
            <p>
              <span className="font-bold">{c.name}</span>{" "}
              <span className="rounded-full border border-line px-2 py-0.5 text-xs">
                {c.kept ? "kept" : "dropped"}
              </span>
            </p>
            <p className="mt-1">
              Decided by:{" "}
              {c.deciding_span_ids.map((id) => `“${spanText(id)}”`).join(", ")}
            </p>
            <p className="mt-1">{c.from_first_principles}</p>
            <p className="mt-1 text-muted">{c.why}</p>
          </li>
        ))}
      </ul>
      <p>
        <span className="font-bold">Chosen: </span>
        {method.chosen}
      </p>
    </>
  );
}
