import type { Chain } from "@/lib/schema";

export default function Goal({ goal }: { goal: Chain["goal"] }) {
  return (
    <div>
      <p className="mb-[6px] mt-3">
        <strong>Asked.</strong> {goal.asked}
      </p>
      <p className="mb-[6px]">
        <strong>Answer form.</strong> {goal.answer_form}
      </p>
      <p>
        <strong>The final line would say.</strong> {goal.final_line_would_say}
      </p>
    </div>
  );
}
