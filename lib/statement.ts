// Statement structure: offset-preserving tokenization of a problem source
// (prose with $…$ / $$…$$ maths) and grouping into renderable blocks.
// Offsets always index into the original source so span marks, which quote
// the source verbatim, can be laid over any part of it.

export type ProseItem = { kind: "prose"; start: number; end: number };
export type MathItem = {
  kind: "math";
  start: number; // includes the delimiters
  end: number;
  inner: string;
  innerStart: number; // offset of inner within the source
  display: boolean;
};
export type Item = ProseItem | MathItem;

export type Block =
  | { kind: "para"; items: Item[] }
  | { kind: "bullets"; bullets: Item[][] }
  | { kind: "display"; item: MathItem };

// Same delimiters lib/latex.ts recognises; exec-based so offsets survive.
const MATH_RE = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\$[^$\n]+?\$)/g;

export function tokenizeStatement(source: string): Item[] {
  const items: Item[] = [];
  const re = new RegExp(MATH_RE.source, "g");
  let cursor = 0;
  for (let m = re.exec(source); m !== null; m = re.exec(source)) {
    if (m.index > cursor) items.push({ kind: "prose", start: cursor, end: m.index });
    const raw = m[0];
    const display = raw.startsWith("$$") || raw.startsWith("\\[");
    const delim = display ? 2 : 1;
    items.push({
      kind: "math",
      start: m.index,
      end: m.index + raw.length,
      inner: raw.slice(delim, raw.length - delim),
      innerStart: m.index + delim,
      display,
    });
    cursor = m.index + raw.length;
  }
  if (cursor < source.length) items.push({ kind: "prose", start: cursor, end: source.length });
  return items;
}

// Blocks: paragraphs split at newlines in prose, "- " lines grouped into
// bullet lists (prefix stripped), $$…$$ as standalone display blocks.
export function buildBlocks(source: string): Block[] {
  const blocks: Block[] = [];
  let para: Item[] = [];
  let bullets: Item[][] | null = null;

  const closePara = () => {
    if (para.length === 0) return;
    const first = para[0];
    const isBullet =
      first.kind === "prose" && source.slice(first.start, first.start + 2) === "- ";
    if (isBullet) {
      const items: Item[] = [{ ...first, start: first.start + 2 }, ...para.slice(1)];
      if (!bullets) bullets = [];
      bullets.push(items.filter((i) => i.start < i.end || i.kind === "math"));
    } else {
      if (bullets) {
        blocks.push({ kind: "bullets", bullets });
        bullets = null;
      }
      blocks.push({ kind: "para", items: para });
    }
    para = [];
  };
  const closeBullets = () => {
    closePara();
    if (bullets) {
      blocks.push({ kind: "bullets", bullets });
      bullets = null;
    }
  };

  for (const item of tokenizeStatement(source)) {
    if (item.kind === "math") {
      if (item.display) {
        closeBullets();
        blocks.push({ kind: "display", item });
      } else {
        para.push(item);
      }
      continue;
    }
    // Prose: split at newlines, keeping offsets; each newline ends a paragraph.
    let lineStart = item.start;
    for (let i = item.start; i < item.end; i++) {
      if (source[i] === "\n") {
        if (i > lineStart) para.push({ kind: "prose", start: lineStart, end: i });
        closePara();
        lineStart = i + 1;
      }
    }
    if (lineStart < item.end) para.push({ kind: "prose", start: lineStart, end: item.end });
  }
  closeBullets();
  return blocks;
}
