import type { Analysis, SpanCategory } from "@/lib/schema";
import Highlight from "@/components/ui/Highlight";
import LayeredReading from "@/components/reading/LayeredReading";

const LEGEND: SpanCategory[] = ["setting", "definition", "rule", "goal", "informal"];

export default function ProblemReading({
  data,
  label,
}: {
  data: Analysis;
  label: string;
}) {
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-[0.875rem] uppercase tracking-[2px] text-muted">
          {label}
        </span>
      </div>
      <LayeredReading
        text={data.problem.text}
        expertSpans={data.expert.spans}
        studentSpans={data.student.spans}
      />
      <div className="mt-4 flex flex-wrap gap-x-[18px] gap-y-2 text-[0.9375rem] text-muted">
        {LEGEND.map((c) => (
          <span key={c}>
            <Highlight category={c} weight={0}>
              {"\u00a0\u00a0\u00a0"}
            </Highlight>{" "}
            {c}
          </span>
        ))}
        <span className="ml-auto">
          <span className="border-b-[3px] border-accent">underline</span> you
          marked it ·{" "}
          <span className="border-b-[3px] border-dashed border-accent">
            dashed
          </span>{" "}
          extraction unsure
        </span>
      </div>
    </div>
  );
}
