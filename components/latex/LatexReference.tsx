"use client";

import { useState } from "react";
import Field from "@/components/ui/Field";
import LatexPreview from "@/components/latex/LatexPreview";

const ROWS: { command: string; sample: string }[] = [
  { command: "\\frac{a}{b}", sample: "\\frac{a}{b}" },
  { command: "\\sqrt{x}, \\sqrt[n]{x}", sample: "\\sqrt{x}, \\sqrt[3]{x}" },
  { command: "x^{2}, a_{n}", sample: "x^{2}, a_{n}" },
  { command: "\\sum_{i=1}^{n}", sample: "\\sum_{i=1}^{n}" },
  { command: "\\prod_{i=1}^{n}", sample: "\\prod_{i=1}^{n}" },
  { command: "\\int_{0}^{1} f(x)\\,dx", sample: "\\int_{0}^{1} f(x)\\,dx" },
  { command: "\\{1, 2, \\dots, 2n\\}", sample: "\\{1, 2, \\dots, 2n\\}" },
  { command: "\\leq, \\geq, \\neq, \\equiv", sample: "\\leq, \\geq, \\neq, \\equiv" },
  { command: "\\forall, \\exists, \\in, \\subseteq", sample: "\\forall, \\exists, \\in, \\subseteq" },
  { command: "\\alpha, \\beta, \\pi, \\infty", sample: "\\alpha, \\beta, \\pi, \\infty" },
  { command: "\\gcd(a,b), \\binom{n}{k}", sample: "\\gcd(a,b), \\binom{n}{k}" },
  { command: "\\alpha, \\beta, \\theta, \\pi", sample: "\\alpha, \\beta, \\theta, \\pi" },
  { command: "\\leq, \\geq, \\neq, \\approx", sample: "\\leq, \\geq, \\neq, \\approx" },
  { command: "\\times, \\div, \\pm", sample: "\\times, \\div, \\pm" },
  { command: "\\binom{n}{k}", sample: "\\binom{n}{k}" },
  { command: "a \\bmod n", sample: "a \\bmod n" },
  { command: "\\in, \\notin, \\subset", sample: "x \\in S, y \\notin T, A \\subset B" },
  { command: "\\ldots, \\cdots", sample: "1, 2, \\ldots, n" },
  { command: "\\left( \\frac{a}{b} \\right)", sample: "\\left( \\frac{a}{b} \\right)" },
  { command: "\\text{words}", sample: "\\text{divides}" },
  { command: "\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}", sample: "\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}" },
  { command: "\\begin{cases} x & x \\ge 0 \\\\ -x & x < 0 \\end{cases}", sample: "\\begin{cases} x & x \\ge 0 \\\\ -x & x < 0 \\end{cases}" },
  { command: "\\begin{aligned} a &= b \\\\ c &= d \\end{aligned}", sample: "\\begin{aligned} a &= b \\\\ c &= d \\end{aligned}" },
  { command: "\\lim_{x \\to 0}", sample: "\\lim_{x \\to 0}" },
  { command: "\\lfloor x \\rfloor, \\lceil x \\rceil", sample: "\\lfloor x \\rfloor, \\lceil x \\rceil" },
  { command: "\\forall, \\exists", sample: "\\forall x \\exists y" },
  { command: "\\to, \\Rightarrow, \\iff", sample: "a \\to b \\Rightarrow c \\iff d" },
  { command: "\\cup, \\cap, \\emptyset", sample: "A \\cup B, A \\cap B, \\emptyset" },
  { command: "\\hat{x}, \\vec{v}, \\overline{AB}", sample: "\\hat{x}, \\vec{v}, \\overline{AB}" },
  { command: "\\equiv", sample: "a \\equiv b" },
  { command: "\\perp, \\parallel", sample: "l \\perp m, l \\parallel n" },
  { command: "\\sin, \\cos, \\log", sample: "\\sin^2 x + \\cos^2 x = 1" },
  { command: "a \\equiv b \\pmod{n}", sample: "a \\equiv b \\pmod{n}" },
  { command: "\\triangle ABC, 90^\\circ", sample: "\\triangle ABC, 90^\\circ" },
];

export default function LatexReference() {
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const visible = ROWS.filter((r) =>
    r.command.toLowerCase().includes(query.trim().toLowerCase())
  );

  async function copy(command: string) {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(command);
    } catch {
      setCopied(null);
    }
  }

  return (
    <div className="px-[1.375rem] pb-7 pt-[0.875rem]">
      <div className="flex min-h-[36px] items-center pr-[46px]">
        <span className="font-display text-[1.75rem] font-bold leading-none text-accent">
          LaTeX reference
        </span>
      </div>
      <p className="mb-3 mt-1 text-[1rem] text-muted">
        New to LaTeX? Each row shows the command and how it renders. Copy
        and paste it into the statement.
      </p>
      <Field
        id="refq"
        value={query}
        onChange={setQuery}
        placeholder="Search, e.g. frac"
        ariaLabel="Search commands"
      />
      <div className="mt-2">
        {visible.map((r, i) => (
          <div
            key={r.command}
            className={`flex items-center justify-between gap-2 py-3 ${
              i > 0 ? "border-t-2 border-dashed border-rule" : ""
            }`}
          >
            <div className="min-w-0">
              <code className="rounded-md bg-card px-[0.4rem] py-[0.1rem] font-mono text-[0.9375rem]">
                {r.command}
              </code>
              <div className="mt-1 overflow-x-auto text-[1.25rem]">
                <LatexPreview tex={`$${r.sample}$`} emptyText="" bare />
              </div>
            </div>
            <button
              type="button"
              onClick={() => copy(r.command)}
              aria-live="polite"
              className="shrink-0 cursor-pointer rounded-lg border-2 border-ink bg-transparent px-[0.6rem] py-[0.1rem] text-[0.875rem]"
            >
              {copied === r.command ? "Copied." : "Copy"}
            </button>
          </div>
        ))}
        {visible.length === 0 && (
          <p className="py-3 text-[1rem] text-muted">
            No matches — try “frac” or “sum”.
          </p>
        )}
      </div>
    </div>
  );
}
