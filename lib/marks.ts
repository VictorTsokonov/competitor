// Mark layout: anchoring spans (verbatim quotes of the statement source)
// as offset ranges, the expert-wins overlap rule, and flattening statement
// items into renderable atoms whose owners the UI wraps in highlights.

import katex from "katex";
import type { Chain } from "./schema";
import type { Item, MathItem } from "./statement";

export type Span = Chain["spans"][number];
export type Mark = Span & { start: number; end: number };

export function locateMarks(source: string, spans: Span[]): Mark[] {
  return spans
    .map((s) => ({ ...s, start: source.indexOf(s.text) }))
    .filter((m) => m.start >= 0)
    .map((m) => ({ ...m, end: m.start + m.text.length }))
    .sort((a, b) => a.start - b.start);
}

export type MarkLayout = {
  // Expert marks laid out first win; a later one starting inside a kept
  // mark is dropped. Solo student marks overlap no kept expert mark.
  kept: Mark[];
  solo: Mark[];
  student: Mark[];
};

export function layoutMarks(
  source: string,
  expertSpans: Span[],
  studentSpans: Span[]
): MarkLayout {
  const kept: Mark[] = [];
  let frontier = 0;
  for (const m of locateMarks(source, expertSpans)) {
    if (m.start < frontier) continue;
    kept.push(m);
    frontier = m.end;
  }
  const student = locateMarks(source, studentSpans);
  const solo = student.filter(
    (s) => !kept.some((k) => s.start < k.end && s.end > k.start)
  );
  return { kept, solo, student };
}

export function sharedWith(layout: MarkLayout, k: Mark): Mark | undefined {
  return layout.student.find((s) => s.start < k.end && s.end > k.start);
}

export type Op = { kind: "expert" | "solo"; mark: Mark };

export function opsOf(layout: MarkLayout): Op[] {
  return [
    ...layout.kept.map((mark) => ({ kind: "expert" as const, mark })),
    ...layout.solo.map((mark) => ({ kind: "solo" as const, mark })),
  ].sort((a, b) => a.mark.start - b.mark.start || (a.kind === "expert" ? -1 : 1));
}

function rendersStandalone(tex: string): boolean {
  if (!tex.trim()) return true;
  try {
    katex.renderToString(tex, { throwOnError: true });
    return true;
  } catch {
    return false;
  }
}

// Cut a maths segment's inner LaTeX at the given source offsets. Null when
// a piece is not renderable on its own; the caller then keeps the formula
// whole and highlights all of it instead of its parts.
function splitMathAt(
  item: MathItem,
  cuts: number[]
): { start: number; end: number; tex: string }[] | null {
  const innerEnd = item.innerStart + item.inner.length;
  const bounds = Array.from(
    new Set(
      cuts
        .filter((c) => c > item.innerStart && c < innerEnd)
        .concat([item.innerStart, innerEnd])
    )
  ).sort((a, b) => a - b);
  const pieces: { start: number; end: number; tex: string }[] = [];
  for (let i = 0; i + 1 < bounds.length; i++) {
    const tex = item.inner.slice(
      bounds[i] - item.innerStart,
      bounds[i + 1] - item.innerStart
    );
    if (!rendersStandalone(tex)) return null;
    pieces.push({ start: bounds[i], end: bounds[i + 1], tex });
  }
  return pieces;
}

// An atom is the smallest rendered unit: a prose slice or a standalone
// LaTeX run, owned by at most one mark. Consecutive atoms with the same
// owner are wrapped in one highlight, so a mark crossing prose and maths
// still reads as one continuous tint.
export type Atom = {
  start: number;
  end: number;
  owner: Op | null;
  content: { kind: "prose"; text: string } | { kind: "math"; tex: string; display: boolean };
};

export function itemAtoms(source: string, item: Item, ops: Op[]): Atom[] {
  const overlapping = ops.filter(
    (op) => op.mark.start < item.end && op.mark.end > item.start
  );
  const ownerOf = (s: number, e: number): Op | null =>
    overlapping.find((op) => op.mark.start <= s && e <= op.mark.end) ?? null;

  if (item.kind === "prose") {
    const bounds = Array.from(
      new Set(
        overlapping
          .flatMap((op) => [op.mark.start, op.mark.end])
          .filter((b) => b > item.start && b < item.end)
          .concat([item.start, item.end])
      )
    ).sort((a, b) => a - b);
    const atoms: Atom[] = [];
    for (let i = 0; i + 1 < bounds.length; i++) {
      atoms.push({
        start: bounds[i],
        end: bounds[i + 1],
        owner: ownerOf(bounds[i], bounds[i + 1]),
        content: { kind: "prose", text: source.slice(bounds[i], bounds[i + 1]) },
      });
    }
    return atoms;
  }

  const whole: Atom = {
    start: item.start,
    end: item.end,
    owner: overlapping[0] ?? null,
    content: { kind: "math", tex: item.inner, display: item.display },
  };
  if (overlapping.length === 0) return [whole];
  const pieces = splitMathAt(
    item,
    overlapping.flatMap((op) => [op.mark.start, op.mark.end])
  );
  if (!pieces) return [whole];
  return pieces.map((p) => ({
    start: p.start,
    end: p.end,
    owner: ownerOf(p.start, p.end),
    content: { kind: "math", tex: p.tex, display: item.display },
  }));
}
