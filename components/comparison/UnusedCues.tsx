import type { Chain } from "@/lib/schema";
import Highlight from "@/components/ui/Highlight";

export default function UnusedCues({
  cues,
  expert,
  student,
}: {
  cues: string[];
  expert: Chain;
  student: Chain;
}) {
  const spanOf = (text: string) =>
    expert.spans.find((s) => s.text === text) ??
    student.spans.find((s) => s.text === text);
  return (
    <div>
      {cues.map((cue) => {
        const span = spanOf(cue);
        return (
          <p key={cue} className="mt-2 text-[1.0625rem]">
            <span className="font-bold">✓</span>{" "}
            {span ? (
              <Highlight category={span.category} weight={span.weight}>
                {span.text}
              </Highlight>
            ) : (
              <span className="font-bold">{cue}</span>
            )}{" "}
            <span className="text-muted">
              you marked it, then your method never used it.
            </span>
          </p>
        );
      })}
    </div>
  );
}
