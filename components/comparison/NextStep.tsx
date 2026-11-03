import { RichTex } from "@/components/reading/Tex";

// The one move to take now, first in the panel: the gentlest rung of the
// hint ladder. Each card's own next move stays folded until the student
// asks for it (FeedbackCardView).
export default function NextStep({ text }: { text: string }) {
  return (
    <div className="relative mt-6 rotate-[-0.3deg] bg-card px-4 pb-3 pt-4 shadow-[2px_3px_0_rgba(43,38,34,0.12)]">
      <span
        aria-hidden="true"
        className="absolute left-1/2 top-[-10px] ml-[-40px] h-5 w-20 rotate-[2deg] bg-[rgba(214,196,150,0.7)]"
      />
      <div className="font-display text-[1.5rem] font-bold leading-none">Your next step</div>
      <p className="mt-1.5 text-[1.0625rem]">
        <RichTex tex={text} />
      </p>
    </div>
  );
}
