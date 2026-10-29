import type { Chain } from "@/lib/schema";

export default function ResponseGoal({ goal }: { goal: Chain["goal"] }) {
  return (
    <>
      <p>
        <span className="font-bold">Asked: </span>
        {goal.asked}
      </p>
      <p>
        <span className="font-bold">Answer form: </span>
        {goal.answer_form}
      </p>
      <p>
        <span className="font-bold">Final line would say: </span>
        {goal.final_line_would_say}
      </p>
    </>
  );
}
