import { Tex } from "@/components/StageCard";
import { SpanHighlight, type HighlightSpan } from "./SpanHighlight";

type Mark = HighlightSpan & { start: number; end: number };

function layoutMarks(text: string, spans: HighlightSpan[]): Mark[] {
  const marks = spans
    .map((s) => ({ ...s, start: text.indexOf(s.text) }))
    .filter((m) => m.start >= 0)
    .map((m) => ({ ...m, end: m.start + m.text.length }))
    .sort((a, b) => a.start - b.start);
  const kept: Mark[] = [];
  let cursor = 0;
  for (const m of marks) {
    if (m.start < cursor) continue;
    kept.push(m);
    cursor = m.end;
  }
  return kept;
}

function renderRun(
  value: string,
  start: number,
  marks: Mark[],
  keyPrefix: string
): React.ReactNode {
  const end = start + value.length;
  const inside = marks.filter((m) => m.start < end && m.end > start);
  if (inside.length === 0) return value;
  const parts: React.ReactNode[] = [];
  let cursor = start;
  inside.forEach((m, i) => {
    const s = Math.max(m.start, start);
    const e = Math.min(m.end, end);
    if (s < cursor) return;
    if (s > cursor) parts.push(value.slice(cursor - start, s - start));
    parts.push(
      <SpanHighlight
        key={`${keyPrefix}-${i}`}
        span={{ ...m, text: value.slice(s - start, e - start) }}
      />
    );
    cursor = e;
  });
  if (cursor < end) parts.push(value.slice(cursor - start));
  return <>{parts}</>;
}

function renderLine(
  line: string,
  lineStart: number,
  marks: Mark[],
  keyPrefix: string
): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const re = /\$([^$]+)\$/g;
  let m: RegExpExecArray | null;
  let last = 0;
  let k = 0;
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) {
      parts.push(
        <span key={`${keyPrefix}-t${k}`}>
          {renderRun(line.slice(last, m.index), lineStart + last, marks, `${keyPrefix}-t${k}`)}
        </span>
      );
      k++;
    }
    parts.push(<Tex key={`${keyPrefix}-m${k}`} tex={m[1]} />);
    k++;
    last = m.index + m[0].length;
  }
  if (last < line.length) {
    parts.push(
      <span key={`${keyPrefix}-t${k}`}>
        {renderRun(line.slice(last), lineStart + last, marks, `${keyPrefix}-t${k}`)}
      </span>
    );
  }
  return <>{parts}</>;
}

export default function ProblemText({
  text,
  spans,
  className,
}: {
  text: string;
  spans: HighlightSpan[];
  className?: string;
}) {
  const marks = layoutMarks(text, spans);
  const lines = text.split("\n");
  const blocks: React.ReactNode[] = [];
  let offset = 0;
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const start = offset;
    offset += line.length + 1;
    if (line.startsWith("- ")) {
      const items: React.ReactNode[] = [];
      let j = i;
      let itemOffset = start;
      while (j < lines.length && lines[j].startsWith("- ")) {
        const body = lines[j].slice(2);
        items.push(
          <li key={j}>{renderLine(body, itemOffset + 2, marks, `l${j}`)}</li>
        );
        itemOffset += lines[j].length + 1;
        j++;
      }
      offset = itemOffset;
      blocks.push(
        <ul key={i} className="list-disc space-y-1 pl-5">
          {items}
        </ul>
      );
      i = j;
    } else {
      blocks.push(<p key={i}>{renderLine(line, start, marks, `l${i}`)}</p>);
      i++;
    }
  }
  return <div className={`space-y-3 ${className ?? ""}`}>{blocks}</div>;
}
