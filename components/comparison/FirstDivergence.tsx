import { STAGE_SOURCES } from "@/lib/stage-sources";

export default function FirstDivergence({ text }: { text: string }) {
  const source = STAGE_SOURCES.divergence;
  return (
    <div>
      <p className="mt-[10px] border-l-4 border-accent pl-[14px] text-[1.0625rem] leading-[1.55]">
        {text}
      </p>
      <div className="mt-1 text-[0.9375rem] italic text-muted">
        {source.cite}. {source.note}
      </div>
    </div>
  );
}
