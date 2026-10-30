import type { Chain } from "@/lib/schema";
import { RichTex } from "@/components/reading/Tex";

export default function Goal({ goal }: { goal: Chain["goal"] }) {
  return (
    <div>
      <p className="mb-[6px] mt-3">
        <strong>Asked.</strong> <RichTex tex={goal.asked} />
      </p>
      <p className="mb-[6px]">
        <strong>Answer form.</strong> <RichTex tex={goal.answer_form} />
      </p>
      <p>
        <strong>The final line would say.</strong>{" "}
        <RichTex tex={goal.final_line_would_say} />
      </p>
    </div>
  );
}
