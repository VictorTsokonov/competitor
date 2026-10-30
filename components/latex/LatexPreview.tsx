import { RichTex } from "@/components/reading/Tex";

export default function LatexPreview({
  tex,
  emptyText,
  minHeight,
  bare,
}: {
  tex: string;
  emptyText: string;
  minHeight?: string;
  bare?: boolean;
}) {
  if (bare) {
    if (!tex.trim()) return <span>{emptyText}</span>;
    return <RichTex tex={tex} />;
  }
  return (
    <div
      aria-live="polite"
      style={minHeight ? { minHeight } : undefined}
      className="w-full rounded-[0.625rem] border-2 border-ink bg-card px-3.5 py-3 text-[1.125rem] leading-[1.6] shadow-[2px_3px_0_rgba(43,38,34,0.12)]"
    >
      {tex.trim() ? (
        <RichTex tex={tex} />
      ) : (
        <span className="text-[var(--placeholder)]">{emptyText}</span>
      )}
    </div>
  );
}
