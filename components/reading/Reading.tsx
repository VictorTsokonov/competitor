import type { Chain } from "@/lib/schema";
import Tag from "@/components/ui/Tag";
import { FieldTex, RichTex, readsAsProse } from "@/components/reading/Tex";
import SpanText from "@/components/reading/SpanText";

// Cue tags light up only for the highest weights; the mockup shows
// rule · 95 on and rule · 85 off.
const TAG_ON_AT = 90;

// A plain-words meaning reads "term: meaning"; a bare formula keeps
// "term = formula". The line supplies its own closing full stop. A term
// with no $ is plain text, so a "%" in it is never read as a LaTeX comment.
function Definition({ term, meaning }: { term: string; meaning: string }) {
  const prose = readsAsProse(meaning);
  return (
    <>
      <em>{term.includes("$") ? <RichTex tex={term} /> : term}</em>
      {prose ? ": " : " = "}
      <FieldTex tex={prose ? meaning.trim().replace(/\.$/, "") : meaning} />
    </>
  );
}

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
              “{span ? <SpanText text={span.text} /> : c.span_id}”{" "}
              {span && (
                <Tag on={span.weight >= TAG_ON_AT}>
                  {span.category} · {span.weight}
                </Tag>
              )}
            </div>
            <div>
              <RichTex tex={c.why_it_matters} />
            </div>
            <div className="text-[1.0625rem] text-muted">
              <RichTex tex={c.how_spotted} />
            </div>
          </div>
        );
      })}
      {reading.definitions.length > 0 && (
        <div className="text-[1.0625rem] text-muted">
          Definitions made explicit:{" "}
          {reading.definitions.map((d, i) => (
            <span key={d.term}>
              {i > 0 && "; "}
              <Definition term={d.term} meaning={d.meaning_latex} />
            </span>
          ))}
          .
        </div>
      )}
    </div>
  );
}
