import { RichTex } from "@/components/reading/Tex";

export default function FirstDivergence({ text }: { text: string }) {
  return (
    <p className="mt-[10px] border-l-4 border-accent pl-[14px] text-[1.0625rem] leading-[1.55]">
      <RichTex tex={text} />
    </p>
  );
}
