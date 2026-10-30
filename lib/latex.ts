import katex from "katex";

type Segment =
  | { kind: "text"; value: string }
  | { kind: "math"; value: string; display: boolean };

// Strip % comments, keeping escaped \% intact.
function stripComments(source: string): string {
  return source
    .split("\n")
    .map((line) => {
      let out = "";
      for (let i = 0; i < line.length; i++) {
        if (line[i] === "%" && line[i - 1] !== "\\") break;
        out += line[i];
      }
      return out;
    })
    .join("\n");
}

// Keep the document body when a preamble is pasted; otherwise drop
// preamble-only lines so they never reach the renderer.
function dropPreamble(source: string): string {
  const begin = source.indexOf("\\begin{document}");
  if (begin >= 0) {
    const end = source.indexOf("\\end{document}");
    return source.slice(
      begin + "\\begin{document}".length,
      end >= 0 ? end : undefined
    );
  }
  return source
    .split("\n")
    .filter(
      (line) =>
        !/^\s*\\(documentclass|usepackage)(\[|\{)/.test(line)
    )
    .join("\n");
}

const MATH_RE = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\$[^$\n]+?\$)/g;

export function splitLatex(source: string): Segment[] {
  const body = dropPreamble(stripComments(source));
  const parts = body.split(MATH_RE).filter((p) => p !== "");
  return parts.map((p) => {
    if (p.startsWith("$$") && p.endsWith("$$")) {
      return { kind: "math", value: p.slice(2, -2), display: true };
    }
    if (p.startsWith("\\[") && p.endsWith("\\]")) {
      return { kind: "math", value: p.slice(2, -2), display: true };
    }
    if (p.startsWith("$") && p.endsWith("$")) {
      return { kind: "math", value: p.slice(1, -1), display: false };
    }
    return { kind: "text", value: p };
  });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// A few text-mode commands users paste; everything else shows literally
// so nothing is silently swallowed.
function renderText(value: string): string {
  let out = escapeHtml(value);
  out = out.replace(/\\\\/g, "<br/>");
  out = out.replace(/\\textbf\{([^{}]*)\}/g, "<strong>$1</strong>");
  out = out.replace(/\\textit\{([^{}]*)\}/g, "<em>$1</em>");
  out = out.replace(/\\emph\{([^{}]*)\}/g, "<em>$1</em>");
  out = out.replace(/\\noindent/g, "");
  out = out.replace(/\\vspace\{[^{}]*\}/g, "");
  out = out.replace(/\n/g, "<br/>");
  return out;
}

export function renderProblemLatex(source: string): string {
  return splitLatex(source)
    .map((seg) =>
      seg.kind === "text"
        ? renderText(seg.value)
        : katex.renderToString(seg.value, {
            throwOnError: false,
            displayMode: seg.display,
          })
    )
    .join("");
}

// First-error reporting for the editor: which math chunk failed and why.
export function findLatexErrors(source: string): string[] {
  const errors: string[] = [];
  for (const seg of splitLatex(source)) {
    if (seg.kind !== "math") continue;
    try {
      katex.renderToString(seg.value, {
        throwOnError: true,
        displayMode: seg.display,
      });
    } catch (e: unknown) {
      errors.push(e instanceof Error ? e.message : "invalid math");
    }
  }
  return errors;
}
