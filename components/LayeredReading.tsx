import type { Chain } from "@/lib/schema";
import { SpanHighlight } from "./SpanHighlight";

type Span = Chain["spans"][number];
type Mark = Span & { start: number; end: number };

// Explicit overlap rule: expert marks are laid out first and win;
// a later mark starting inside a kept mark is dropped. A kept expert
// mark counts as shared when any student mark overlaps it. A student
// mark that overlaps no kept expert mark renders as an outline on its own.
export default function LayeredReading({
  text,
  expertSpans,
  studentSpans,
}: {
  text: string;
  expertSpans: Span[];
  studentSpans: Span[];
}) {
  const locate = (spans: Span[]): Mark[] =>
    spans
      .map((s) => ({ ...s, start: text.indexOf(s.text) }))
      .filter((m) => m.start >= 0)
      .map((m) => ({ ...m, end: m.start + m.text.length }))
      .sort((a, b) => a.start - b.start);

  const kept: Mark[] = [];
  let frontier = 0;
  for (const m of locate(expertSpans)) {
    if (m.start < frontier) continue;
    kept.push(m);
    frontier = m.end;
  }
  const overlaps = (m: Mark) =>
    kept.some((k) => m.start < k.end && m.end > k.start);
  const sharedWith = (k: Mark) =>
    locate(studentSpans).find((s) => s.start < k.end && s.end > k.start);
  const solo = locate(studentSpans).filter((s) => !overlaps(s));

  type Op =
    | { start: number; kind: "expert"; mark: Mark }
    | { start: number; kind: "solo"; mark: Mark };
  const ops: Op[] = [
    ...kept.map((mark) => ({ start: mark.start, kind: "expert" as const, mark })),
    ...solo.map((mark) => ({ start: mark.start, kind: "solo" as const, mark })),
  ].sort((a, b) => a.start - b.start || (a.kind === "expert" ? -1 : 1));

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  ops.forEach((op, i) => {
    if (op.start < cursor) return;
    if (op.start > cursor) parts.push(text.slice(cursor, op.start));
    const end = op.mark.end;
    const slice = text.slice(op.start, end);
    if (op.kind === "expert") {
      const hit = sharedWith(op.mark);
      const fill = (
        <SpanHighlight
          span={{ ...op.mark, text: slice }}
        />
      );
      parts.push(
        hit ? (
          <span
            key={i}
            style={{
              borderBottom: `2px ${hit.uncertain ? "dashed" : "solid"} var(--accent)`,
            }}
            title={
              hit.uncertain
                ? "You marked this; extraction is uncertain — check your photo."
                : "You marked this too."
            }
          >
            {fill}
          </span>
        ) : (
          <span key={i}>{fill}</span>
        )
      );
    } else {
      parts.push(
        <span
          key={i}
          style={{
            borderBottom: `2px ${op.mark.uncertain ? "dashed" : "solid"} var(--accent)`,
          }}
          title={
            op.mark.uncertain
              ? "Uncertain extraction — check against your photo."
              : "Only you marked this."
          }
        >
          {slice}
        </span>
      );
    }
    cursor = end;
  });
  if (cursor < text.length) parts.push(text.slice(cursor));

  return (
    <div className="text-sm leading-relaxed">
      <p>{parts}</p>
      {solo.some((s) => s.uncertain) ||
      locate(studentSpans).some((s) => s.uncertain && overlaps(s)) ? (
        <p className="mt-2 text-xs text-muted">
          Dashed marks are uncertain — verify them against your photo.
        </p>
      ) : null}
    </div>
  );
}

export function LayerLegend() {
  return (
    <ul className="space-y-1 text-xs text-muted">
      <li>
        <span className="rounded bg-surface px-1">Filled phrase</span> expert cue
        (darker = higher weight)
      </li>
      <li>
        <span style={{ borderBottom: "2px solid var(--accent)" }}>Underlined</span>{" "}
        you marked it too
      </li>
      <li>
        <span style={{ borderBottom: "2px dashed var(--accent)" }}>Dashed</span>{" "}
        uncertain extraction
      </li>
    </ul>
  );
}
