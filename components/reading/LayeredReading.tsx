import type { Chain } from "@/lib/schema";
import Highlight from "@/components/ui/Highlight";
import { Tex } from "@/components/reading/Tex";
import { buildBlocks, type Item } from "@/lib/statement";
import {
  itemAtoms,
  layoutMarks,
  opsOf,
  sharedWith,
  type Atom,
  type MarkLayout,
  type Op,
} from "@/lib/marks";

type Span = Chain["spans"][number];

function AtomContent({ atom }: { atom: Atom }) {
  if (atom.content.kind === "prose") return <>{atom.content.text}</>;
  const { tex, display } = atom.content;
  // Whitespace between formula pieces stays plain so word spacing survives.
  if (!tex.trim()) return <>{tex}</>;
  return <Tex tex={display ? `\\displaystyle ${tex}` : tex} />;
}

function MarkedGroup({
  op,
  layout,
  children,
}: {
  op: Op;
  layout: MarkLayout;
  children: React.ReactNode;
}) {
  const m = op.mark;
  if (op.kind === "expert") {
    const hit = sharedWith(layout, m);
    return (
      <span
        title={
          hit
            ? hit.uncertain
              ? "You marked this; extraction is uncertain — check your photo."
              : "You marked this too."
            : `${m.category} · weight ${m.weight} — ${m.reason}`
        }
      >
        <Highlight
          category={m.category}
          weight={m.weight}
          you={hit !== undefined}
          unsure={hit?.uncertain}
        >
          {children}
        </Highlight>
      </span>
    );
  }
  return (
    <span
      className={
        m.uncertain
          ? "border-b-[3px] border-dashed border-accent"
          : "border-b-[3px] border-accent"
      }
      title={
        m.uncertain
          ? "Uncertain extraction — check against your photo."
          : "Only you marked this."
      }
    >
      {children}
    </span>
  );
}

export default function LayeredReading({
  text,
  expertSpans,
  studentSpans,
}: {
  text: string;
  expertSpans: Span[];
  studentSpans: Span[];
}) {
  const layout = layoutMarks(text, expertSpans, studentSpans);
  const ops = opsOf(layout);

  // Consecutive atoms owned by the same mark render inside one highlight,
  // so a mark crossing prose and maths keeps a continuous tint.
  function renderItems(items: Item[], keyPrefix: string): React.ReactNode {
    const atoms = items.flatMap((item) => itemAtoms(text, item, ops));
    const out: React.ReactNode[] = [];
    let i = 0;
    let k = 0;
    while (i < atoms.length) {
      const owner = atoms[i].owner;
      let j = i;
      while (j < atoms.length && atoms[j].owner === owner) j++;
      const children = atoms
        .slice(i, j)
        .map((a, n) => <AtomContent key={n} atom={a} />);
      out.push(
        owner ? (
          <MarkedGroup key={`${keyPrefix}-${k++}`} op={owner} layout={layout}>
            {children}
          </MarkedGroup>
        ) : (
          <span key={`${keyPrefix}-${k++}`}>{children}</span>
        )
      );
      i = j;
    }
    return <>{out}</>;
  }

  const blocks = buildBlocks(text).map((block, b) => {
    if (block.kind === "display") {
      return (
        <div key={b} className="text-center">
          {renderItems([block.item], `b${b}`)}
        </div>
      );
    }
    if (block.kind === "bullets") {
      return (
        <ul key={b} className="ml-6 list-disc">
          {block.bullets.map((items, n) => (
            <li key={n}>{renderItems(items, `b${b}-${n}`)}</li>
          ))}
        </ul>
      );
    }
    return <p key={b}>{renderItems(block.items, `b${b}`)}</p>;
  });

  const keptOverlaps = (s: { start: number; end: number }) =>
    layout.kept.some((k) => s.start < k.end && s.end > k.start);
  const anyUncertain =
    layout.solo.some((s) => s.uncertain) ||
    layout.student.some((s) => s.uncertain && keptOverlaps(s));

  return (
    <div>
      <div className="grid gap-[10px]">{blocks}</div>
      {anyUncertain && (
        <p className="mt-2 text-[0.9375rem] text-muted">
          Dashed marks are uncertain — verify them against your photo.
        </p>
      )}
    </div>
  );
}
