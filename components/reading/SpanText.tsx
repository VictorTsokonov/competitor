import { RichTex, Tex } from "@/components/reading/Tex";

// Span texts quote the statement source verbatim, so they come in three
// shapes: pure prose, prose with balanced $…$ runs, or a raw LaTeX slice
// from inside a formula (no $ but carrying commands/scripts/braces).
export default function SpanText({ text }: { text: string }) {
  const dollars = (text.match(/\$/g) ?? []).length;
  if (dollars % 2 === 1) return <>{text}</>; // cut across a $ boundary: show raw
  if (dollars > 0) return <RichTex tex={text} />;
  if (/[\\^_{}]/.test(text)) return <Tex tex={text} />;
  return <>{text}</>;
}
