import { RichTex } from "@/components/reading/Tex";

// A problem's name over its rendered statement, above whatever its state
// shows; the statement is left out while it is still being transcribed.
export default function ProblemHeading({
  name,
  statement,
}: {
  name: string;
  statement: string;
}) {
  return (
    <>
      <h2 className="font-display text-[2.5rem] font-bold leading-none">{name}</h2>
      {statement && (
        <div className="mb-[30px] mt-4">
          <RichTex tex={statement} />
        </div>
      )}
    </>
  );
}
