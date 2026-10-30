import type { Chain } from "@/lib/schema";
import Highlight from "@/components/ui/Highlight";

type Span = Chain["spans"][number];
type Mark = Span & { start: number; end: number };

// Explicit overlap rule: expert marks are laid out first and win;
// a later mark starting inside a kept mark is dropped. A kept expert
// mark counts as shared when any student mark overlaps it. A student
// mark that overlaps no kept expert mark renders as an underline on its own.
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
  const student = locate(studentSpans);
  const overlaps = (m: Mark) =>
    kept.some((k) => m.start < k.end && m.end > k.start);
  const sharedWith = (k: Mark) =>
    student.find((s) => s.start < k.end && s.end > k.start);
  const solo = student.filter((s) => !overlaps(s));

  type Op =
    | { start: number; kind: "expert"; mark: Mark }
    | { start: number; kind: "solo"; mark: Mark };
  const ops: Op[] = [
    ...kept.map((mark) => ({ start: mark.start, kind: "expert" as const, mark })),
    ...solo.map((mark) => ({ start: mark.start, kind: "solo" as const, mark })),
  ].sort((a, b) => a.start - b.start || (a.kind === "expert" ? -1 : 1));

  function renderRange(start: number, end: number, keyPrefix: string): React.ReactNode {
    const parts: React.ReactNode[] = [];
    let cursor = start;
    let k = 0;
    for (const op of ops) {
      const m = op.mark;
      if (m.end <= start || m.start >= end) continue;
      const s = Math.max(m.start, start);
      const e = Math.min(m.end, end);
      if (s < cursor) continue;
      if (s > cursor) parts.push(text.slice(cursor, s));
      if (op.kind === "expert") {
        const hit = sharedWith(m);
        parts.push(
          <span
            key={`${keyPrefix}-${k++}`}
            title={
              hit
                ? hit.uncertain
                  ? "You marked this; extraction is uncertain — check your photo."
                  : "You marked this too."
                : `${m.category} · weight ${m.weight} — ${m.reason}`
            }
          >
            <Highlight
              category={m.category}
              weight={m.weight}
              you={hit !== undefined}
              unsure={hit?.uncertain}
            >
              {text.slice(s, e)}
            </Highlight>
          </span>
        );
      } else {
        parts.push(
          <span
            key={`${keyPrefix}-${k++}`}
            className={
              m.uncertain
                ? "border-b-[3px] border-dashed border-accent"
                : "border-b-[3px] border-accent"
            }
            title={
              m.uncertain
                ? "Uncertain extraction — check against your photo."
                : "Only you marked this."
            }
          >
            {text.slice(s, e)}
          </span>
        );
      }
      cursor = e;
    }
    if (cursor < end) parts.push(text.slice(cursor, end));
    return <>{parts}</>;
  }

  const lines = text.split("\n");
  const blocks: React.ReactNode[] = [];
  let offset = 0;
  let i = 0;
  while (i < lines.length) {
    if (lines[i].startsWith("- ")) {
      const items: React.ReactNode[] = [];
      let j = i;
      let itemOffset = offset;
      while (j < lines.length && lines[j].startsWith("- ")) {
        const bodyStart = itemOffset + 2;
        items.push(
          <li key={j}>{renderRange(bodyStart, bodyStart + lines[j].length - 2, `l${j}`)}</li>
        );
        itemOffset += lines[j].length + 1;
        j++;
      }
      offset = itemOffset;
      blocks.push(
        <ul key={i} className="ml-6 list-disc">
          {items}
        </ul>
      );
      i = j;
    } else {
      const start = offset;
      offset += lines[i].length + 1;
      blocks.push(<p key={i}>{renderRange(start, start + lines[i].length, `l${i}`)}</p>);
      i++;
    }
  }

  const anyUncertain =
    solo.some((s) => s.uncertain) ||
    student.some((s) => s.uncertain && overlaps(s));

  return (
    <div>
      <div className="grid gap-[10px]">{blocks}</div>
      {anyUncertain && (
        <p className="mt-2 text-[0.9375rem] text-muted">
          Dashed marks are uncertain — verify them against your photo.
        </p>
      )}
    </div>
  );
}
