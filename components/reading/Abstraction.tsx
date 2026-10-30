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
          <strong>
            <RichTex tex={u.object} />
          </strong>{" "}
          is really <RichTex tex={u.really_is} />{" "}
          <span className="text-muted">
            → <RichTex tex={u.implies} />.
          </span>
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
