import type { Chain } from "@/lib/schema";
import { RichTex, Tex } from "@/components/reading/Tex";

export default function Simplification({
  simplification,
}: {
  simplification: Chain["simplification"];
}) {
  return (
    <div>
      <p className="mb-[10px] mt-3">
        <RichTex tex={simplification.instance} />{" "}
        <Tex tex={simplification.instance_latex} />{" "}
        <RichTex tex={simplification.what_to_try} />
      </p>
      <p className="border-l-4 border-accent px-[18px] py-[10px] italic">
        <RichTex tex={simplification.notice_prompt} />
      </p>
    </div>
  );
}
