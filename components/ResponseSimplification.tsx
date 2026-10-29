import type { Chain } from "@/lib/schema";
import { Tex } from "@/components/StageCard";

export default function ResponseSimplification({
  simplification,
}: {
  simplification: Chain["simplification"];
}) {
  return (
    <>
      <p>{simplification.instance}</p>
      <p>
        <Tex tex={simplification.instance_latex} />
      </p>
      <p>{simplification.what_to_try}</p>
      <p className="ml-2 border-l border-accent pl-4 italic">
        {simplification.notice_prompt}
      </p>
    </>
  );
}
