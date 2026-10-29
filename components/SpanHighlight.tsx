import type { SpanCategory } from "@/lib/schema";

export type HighlightSpan = {
  text: string;
  category: SpanCategory;
  weight: number;
  reason: string;
};

export function SpanHighlight({ span }: { span: HighlightSpan }) {
  const opacity = 0.25 + (span.weight / 100) * 0.35;
  return (
    <mark
      style={{
        backgroundColor: `rgba(var(--cat-${span.category}),${opacity.toFixed(2)})`,
        color: "inherit",
        borderRadius: 4,
        padding: "0 2px",
      }}
      title={`${span.category} · weight ${span.weight} — ${span.reason}`}
    >
      {span.text}
    </mark>
  );
}

export function HighlightedText({
  text,
  spans,
}: {
  text: string;
  spans: HighlightSpan[];
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
      <SpanHighlight
        key={i}
        span={{ ...m, text: text.slice(m.start, m.start + m.text.length) }}
      />
    );
    cursor = m.start + m.text.length;
  });
  if (cursor < text.length) parts.push(text.slice(cursor));

  return <>{parts}</>;
}
