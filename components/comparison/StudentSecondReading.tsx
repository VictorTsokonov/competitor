import type { Chain } from "@/lib/schema";
import SecondReading from "@/components/reading/SecondReading";

export default function StudentSecondReading({ student }: { student: Chain }) {
  const second = student.second_reading;
  const hasData =
    second.what_changed.length > 0 ||
    second.new_spans.length > 0 ||
    second.reweighted.length > 0;
  if (!hasData) {
    return (
      <p className="mt-2 text-[1.0625rem] text-muted">
        Your second reading made no changes.
      </p>
    );
  }
  return <SecondReading second_reading={second} spans={student.spans} />;
}
