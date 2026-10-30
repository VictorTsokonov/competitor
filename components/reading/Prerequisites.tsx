import type { Chain } from "@/lib/schema";
import Tag from "@/components/ui/Tag";

export default function Prerequisites({
  prerequisites,
}: {
  prerequisites: Chain["prerequisites"];
}) {
  return (
    <div className="mt-[14px] grid grid-cols-2 gap-[14px] gap-x-7 text-[1.125rem] max-[60rem]:grid-cols-1">
      {prerequisites.map((p) => (
        <div key={p.name}>
          <strong>{p.name}</strong> <Tag on={p.flag === "needed"}>{p.flag}</Tag>
          <div className="text-muted">{p.needed_for}</div>
        </div>
      ))}
    </div>
  );
}
