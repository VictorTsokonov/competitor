import type { Chain } from "@/lib/schema";
import Highlight from "@/components/ui/Highlight";
import { RichTex } from "@/components/reading/Tex";
import SpanText from "@/components/reading/SpanText";

export default function InformalCues({
  informal_cues,
  spans,
}: {
  informal_cues: Chain["informal_cues"];
  spans: Chain["spans"];
}) {
  const spanOf = (id: string) => spans.find((s) => s.id === id);
  return (
    <ul className="ml-[22px] mt-3 grid list-disc gap-2">
      {informal_cues.map((c, i) => {
        const span = spanOf(c.span_id);
        return (
          <li key={i}>
            {span ? (
              <Highlight category={span.category} weight={span.weight}>
                <SpanText text={span.text} />
              </Highlight>
            ) : (
              <span className="font-bold">“{c.span_id}”</span>
            )}
            : <RichTex tex={c.bearing} />
          </li>
        );
      })}
    </ul>
  );
}
