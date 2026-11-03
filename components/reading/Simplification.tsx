import type { Chain } from "@/lib/schema";
import { FieldTex, RichTex, readsAsProse } from "@/components/reading/Tex";

// The three parts run on as one paragraph, so a prose part the model left
// without closing punctuation gets a full stop rather than running into
// the next. A bare formula instance_latex keeps its LaTeX, and its full
// stop is printed after it.
const CLOSED = /[.!?:;]["')\]$]*$/;

function asSentence(text: string): string {
  const trimmed = text.trim();
  if (trimmed === "" || CLOSED.test(trimmed)) return trimmed;
  return `${trimmed}.`;
}

export default function Simplification({
  simplification,
}: {
  simplification: Chain["simplification"];
}) {
  const raw = simplification.instance_latex.trim();
  const prose = readsAsProse(raw);
  const instanceLatex = prose ? asSentence(raw) : raw;
  const formulaStop = !prose && raw !== "" && !CLOSED.test(raw) ? "." : "";
  return (
    <div>
      <p className="mb-[10px] mt-3">
        <RichTex tex={asSentence(simplification.instance)} />{" "}
        <FieldTex tex={instanceLatex} />
        {formulaStop}{" "}
        <RichTex tex={asSentence(simplification.what_to_try)} />
      </p>
      <p className="border-l-4 border-accent px-[18px] py-[10px] italic">
        <RichTex tex={simplification.notice_prompt} />
      </p>
    </div>
  );
}
