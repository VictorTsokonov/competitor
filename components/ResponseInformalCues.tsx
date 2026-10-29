import type { Chain } from "@/lib/schema";

export default function ResponseInformalCues({
  informal_cues,
  spans,
}: {
  informal_cues: Chain["informal_cues"];
  spans: Chain["spans"];
}) {
  const spanText = (id: string) =>
    spans.find((s) => s.id === id)?.text ?? id;
  return (
    <ul className="list-disc space-y-2 pl-5">
      {informal_cues.map((c, i) => (
        <li key={i}>
          <span className="font-bold">“{spanText(c.span_id)}”</span>
          <span> — {c.bearing}</span>
        </li>
      ))}
    </ul>
  );
}
