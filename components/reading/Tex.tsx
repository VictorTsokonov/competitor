import katex from "katex";
import { renderProblemLatex } from "@/lib/latex";

export function Tex({ tex }: { tex: string }) {
  const html = katex.renderToString(tex, { throwOnError: false });
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

export function RichTex({ tex }: { tex: string }) {
  const html = renderProblemLatex(tex);
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

// meaning_latex and instance_latex held bare LaTeX until the plain style
// (lib/providers/meta/plainStyle.ts) let them be words with inline $…$.
// A field reads as prose when it has a $ or no LaTeX syntax at all, so
// recorded runs and new plain-words fields both render.
export function readsAsProse(text: string): boolean {
  return text.includes("$") || !/[\\^_{}]/.test(text);
}

export function FieldTex({ tex }: { tex: string }) {
  return readsAsProse(tex) ? <RichTex tex={tex} /> : <Tex tex={tex} />;
}
