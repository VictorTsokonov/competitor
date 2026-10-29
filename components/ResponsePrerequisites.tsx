import type { Chain } from "@/lib/schema";

export default function ResponsePrerequisites({
  prerequisites,
}: {
  prerequisites: Chain["prerequisites"];
}) {
  return (
    <dl className="space-y-3">
      {prerequisites.map((p) => (
        <div key={p.name} className="grid grid-cols-[1fr_2fr] gap-4">
          <dt>
            <span className="font-bold">{p.name}</span>{" "}
            <span className="rounded-full border border-line px-2 py-0.5 text-xs">
              {p.flag}
            </span>
          </dt>
          <dd>{p.needed_for}</dd>
        </div>
      ))}
    </dl>
  );
}
