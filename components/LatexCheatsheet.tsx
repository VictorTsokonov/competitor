"use client";

import { useState } from "react";
import { Tex } from "@/components/StageCard";

const ROWS: { command: string; sample: string }[] = [
  { command: "\\frac{a}{b}", sample: "\\frac{a}{b}" },
  { command: "\\sqrt{x}, \\sqrt[n]{x}", sample: "\\sqrt{x}, \\sqrt[3]{x}" },
  { command: "x^{2}, a_{n}", sample: "x^{2}, a_{n}" },
  { command: "\\sum_{i=1}^{n}", sample: "\\sum_{i=1}^{n}" },
  { command: "\\prod_{i=1}^{n}", sample: "\\prod_{i=1}^{n}" },
  { command: "\\int_{0}^{1}", sample: "\\int_{0}^{1}" },
  { command: "\\infty", sample: "\\infty" },
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

export default function LatexCheatsheet() {
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
    <div className="w-80 shrink-0 px-5 py-4">
      <h2 className="font-semibold">LaTeX reference</h2>
      <p className="mt-1 text-sm text-muted">
        Click a row to copy its command.
      </p>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search, e.g. frac"
        aria-label="Search LaTeX reference"
        className="mt-3 w-full rounded-[16px] border border-line bg-background px-4 py-2 text-sm"
      />
      <ul className="mt-3 space-y-3">
        {visible.map((r) => (
          <li key={r.command} className="border-b border-line pb-3">
            <button
              onClick={() => copy(r.command)}
              title="Copy command"
              className="block w-full text-left"
            >
              <code className="block overflow-x-auto text-xs">{r.command}</code>
              <span className="mt-1 block overflow-x-auto text-[15px]">
                <Tex tex={r.sample} />
              </span>
              <span className="mt-1 block text-xs text-muted" aria-live="polite">
                {copied === r.command ? "Copied." : "Copy"}
              </span>
            </button>
          </li>
        ))}
        {visible.length === 0 && (
          <li className="text-sm text-muted">No matches — try “frac” or “sum”.</li>
        )}
      </ul>
    </div>
  );
}
