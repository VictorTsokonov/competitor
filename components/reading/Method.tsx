import type { Chain } from "@/lib/schema";
import Highlight from "@/components/ui/Highlight";
import Tag from "@/components/ui/Tag";
import { RichTex } from "@/components/reading/Tex";

export default function Method({
  method,
  spans,
}: {
  method: Chain["method"];
  spans: Chain["spans"];
}) {
  const spanOf = (id: string) => spans.find((s) => s.id === id);
  return (
    <div className="mt-3 grid gap-3">
      {method.candidates.map((c) => (
        <div key={c.name} className="flex items-start gap-[14px]">
          <Tag on={c.kept}>{c.kept ? "kept" : "dropped"}</Tag>
          <div>
            <strong>{c.name}.</strong>{" "}
            {c.kept ? (
              <>
                Deciding cues:{" "}
                {c.deciding_span_ids.map((id, i) => {
                  const span = spanOf(id);
                  return (
                    <span key={id}>
                      {i > 0 && ", "}
                      {span ? (
                        <Highlight category={span.category} weight={span.weight}>
                          {span.text}
                        </Highlight>
                      ) : (
                        `“${id}”`
                      )}
                    </span>
                  );
                })}
                . <RichTex tex={c.from_first_principles} />
              </>
            ) : (
              <>
                {c.why}{" "}
                {c.deciding_span_ids.length > 0 && (
                  <span className="text-muted">
                    Decided by:{" "}
                    {c.deciding_span_ids
                      .map((id) => `“${spanOf(id)?.text ?? id}”`)
                      .join(", ")}
                    .
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
