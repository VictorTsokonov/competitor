import type { Chain } from "@/lib/schema";

export default function ResponseAbstraction({
  abstraction,
}: {
  abstraction: Chain["abstraction"];
}) {
  return (
    <>
      {abstraction.underneath.map((u, i) => (
        <p key={i}>
          <span className="font-bold">{u.object}</span> is really {u.really_is},
          so {u.implies}.
        </p>
      ))}
      {abstraction.deeper_properties.length > 0 && (
        <ul className="list-disc space-y-2 pl-5">
          {abstraction.deeper_properties.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      )}
    </>
  );
}
