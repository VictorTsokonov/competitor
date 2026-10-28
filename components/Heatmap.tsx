type Span = { text: string; weight: number; reason: string };

const WEIGHT_CLASS = ["hm-0", "hm-1", "hm-2", "hm-3"];

export default function Heatmap({
  text,
  spans,
  label,
}: {
  text: string;
  spans: Span[];
  label: string;
}) {
  const marks = spans
    .map((s) => ({ ...s, start: text.indexOf(s.text) }))
    .filter((m) => m.start >= 0)
    .sort((a, b) => a.start - b.start);

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  marks.forEach((m, i) => {
    if (m.start < cursor) return;
    if (m.start > cursor) parts.push(text.slice(cursor, m.start));
    parts.push(
      <mark key={i} className={WEIGHT_CLASS[m.weight] ?? "hm-0"} title={m.reason}>
        {text.slice(m.start, m.start + m.text.length)}
      </mark>
    );
    cursor = m.start + m.text.length;
  });
  if (cursor < text.length) parts.push(text.slice(cursor));

  return (
    <div>
      <p className="mb-1 text-sm font-semibold">{label}</p>
      <p className="leading-relaxed">{parts}</p>
    </div>
  );
}
