import type { SpanCategory } from "@/lib/schema";
import { HighlightedText, type HighlightSpan } from "./SpanHighlight";

const CATEGORIES: SpanCategory[] = [
  "setting",
  "definition",
  "rule",
  "goal",
  "informal",
];

export function CategoryLegend() {
  return (
    <div className="flex flex-wrap gap-3">
      {CATEGORIES.map((c) => (
        <span key={c} className="flex items-center gap-1 text-xs text-muted">
          <span
            aria-hidden="true"
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: `rgb(var(--cat-${c}))` }}
          />
          {c}
        </span>
      ))}
    </div>
  );
}

export default function Heatmap({
  text,
  spans,
  label,
}: {
  text: string;
  spans: HighlightSpan[];
  label: string;
}) {
  return (
    <div>
      <p className="mb-1 text-sm font-semibold">{label}</p>
      <p className="leading-relaxed">
        <HighlightedText text={text} spans={spans} />
      </p>
    </div>
  );
}
