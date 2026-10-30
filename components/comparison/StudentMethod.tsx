import type { Chain } from "@/lib/schema";
import Highlight from "@/components/ui/Highlight";
import { RichTex } from "@/components/reading/Tex";
import SpanText from "@/components/reading/SpanText";

export default function StudentMethod({ student }: { student: Chain }) {
  const spanOf = (id: string) => student.spans.find((s) => s.id === id);
  const kept = student.method.candidates.filter((c) => c.kept);
  const dropped = student.method.candidates.filter((c) => !c.kept);
  if (kept.length === 0 && dropped.length === 0) {
    return <p className="mt-2 text-[1.0625rem] text-muted">Your method wasn’t captured.</p>;
  }
  return (
    <div className="mt-2 text-[1.0625rem]">
      {kept.map((c) => (
        <p key={c.name}>
          <RichTex tex={c.name} />
          {c.deciding_span_ids.length > 0 && (
            <>
              , triggered by{" "}
              {c.deciding_span_ids.map((id, i) => {
                const span = spanOf(id);
                return (
                  <span key={id}>
                    {i > 0 && ", "}
                    {span ? (
                      <Highlight category={span.category} weight={span.weight}>
                        <SpanText text={span.text} />
                      </Highlight>
                    ) : (
                      `“${id}”`
                    )}
                  </span>
                );
              })}
            </>
          )}
          .
        </p>
      ))}
      {dropped.map((c) => (
        <p key={c.name}>
          “<RichTex tex={c.name} />” was considered and dropped:{" "}
          <RichTex tex={c.why} />
        </p>
      ))}
    </div>
  );
}
