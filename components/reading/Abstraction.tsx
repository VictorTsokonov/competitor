import type { Chain } from "@/lib/schema";
import { RichTex } from "@/components/reading/Tex";

export default function Abstraction({
  abstraction,
}: {
  abstraction: Chain["abstraction"];
}) {
  return (
    <div className="mt-3 grid gap-3">
      {abstraction.underneath.map((u, i) => (
        <div key={i}>
          <strong>{u.object}</strong> is really {u.really_is}{" "}
          <span className="text-muted">→ {u.implies}.</span>
        </div>
      ))}
      {abstraction.deeper_properties.map((d, i) => (
        <p key={i} className="border-l-4 border-accent px-[18px] py-[10px]">
          <RichTex tex={d} />
        </p>
      ))}
    </div>
  );
}
