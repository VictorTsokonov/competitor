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
