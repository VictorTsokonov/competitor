import { RichTex, Tex } from "@/components/reading/Tex";

// A quoted span always sits inside a sentence or a chip, so a display
// formula it quotes ($$…$$, e.g. a student span covering the whole
// equation) is set inline: inline maths wraps at + − =, a display block
// never wraps and would push its panel sideways.
function inlineDisplay(text: string): string {
  return text.replace(/\$\$([\s\S]+?)\$\$/g, (_, body: string) => `$${body.replace(/\s*\n\s*/g, " ")}$`);
}

// Span texts quote the statement source verbatim, so they come in three
// shapes: pure prose, prose with balanced $…$ runs, or a raw LaTeX slice
// from inside a formula (no $ but carrying commands/scripts/braces).
export default function SpanText({ text }: { text: string }) {
  const dollars = (text.match(/\$/g) ?? []).length;
  if (dollars % 2 === 1) return <>{text}</>; // cut across a $ boundary: show raw
  if (dollars > 0) return <RichTex tex={inlineDisplay(text)} />;
  if (/[\\^_{}]/.test(text)) return <Tex tex={text} />;
  return <>{text}</>;
}
