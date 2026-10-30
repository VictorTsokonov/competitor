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

export default function StageCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[16px] bg-surface p-5">
      <h3 className="mb-3 text-base font-semibold">{title}</h3>
      <div className="space-y-2 text-[15px]">{children}</div>
    </section>
  );
}
