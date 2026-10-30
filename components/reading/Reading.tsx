import type { Chain } from "@/lib/schema";
import Tag from "@/components/ui/Tag";
import { Tex } from "@/components/reading/Tex";

// Cue tags light up only for the highest weights; the mockup shows
// rule · 95 on and rule · 85 off.
const TAG_ON_AT = 90;

export default function Reading({
  reading,
  spans,
}: {
  reading: Chain["reading"];
  spans: Chain["spans"];
}) {
  const spanOf = (id: string) => spans.find((s) => s.id === id);
  return (
    <div className="mt-4 grid gap-4">
      {reading.cues.map((c) => {
        const span = spanOf(c.span_id);
        return (
          <div key={c.id}>
            <div className="font-bold">
              “{span?.text ?? c.span_id}”{" "}
              {span && (
                <Tag on={span.weight >= TAG_ON_AT}>
                  {span.category} · {span.weight}
                </Tag>
              )}
            </div>
            <div>{c.why_it_matters}</div>
            <div className="text-[1.0625rem] text-muted">{c.how_spotted}</div>
          </div>
        );
      })}
      {reading.definitions.length > 0 && (
        <div className="text-[1.0625rem] text-muted">
          Definitions made explicit:{" "}
          {reading.definitions.map((d, i) => (
            <span key={d.term}>
              {i > 0 && "; "}
              <em>{d.term}</em> = <Tex tex={d.meaning_latex} />
            </span>
          ))}
          .
        </div>
      )}
    </div>
  );
}
