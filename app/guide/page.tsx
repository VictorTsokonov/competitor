import Header from "@/components/layout/Header";
import Pill from "@/components/ui/Pill";

const WRAP = "mx-auto max-w-[900px] px-8 pl-[clamp(1.25rem,6vw,5.5rem)]";

const STEPS = [
  {
    numeral: "(i)",
    title: "Mark the phrases",
    body: "Copy the problem. Underline every phrase that seems to matter and write one line beside it: what does this suggest?",
    example: 'Circling "n+1" and noting "one more than the number of boxes".',
  },
  {
    numeral: "(ii)",
    title: "Say what it is about",
    body: "One sentence, before any maths. What kind of problem is this, and what shape does it have?",
    example: '"This is about forcing a pair, not finding one."',
  },
  {
    numeral: "(iii)",
    title: "Define the objects",
    body: "Name what is given and what is wanted. Write the definitions you are relying on.",
    example: '"Given S of size n+1; wanted a, b in S with gcd 1."',
  },
  {
    numeral: "(iv)",
    title: "List candidate methods",
    body: "Two or three. For each, which phrase made you think of it and why you kept or dropped it. This is the stage the comparison cares about most.",
    example: '"Pigeonhole, triggered by n+1 against n pairs; kept."',
  },
  {
    numeral: "(v)",
    title: "Attempt",
    body: "Work the problem with your chosen method, a line of reasoning beside each step. Twenty to thirty minutes, then stop.",
    example: "Dark pen, one page per photo, good light.",
  },
];

export default function Guide() {
  return (
    <div className="min-h-screen">
      <Header />

      <section className={`${WRAP} pb-6 pt-[clamp(2.5rem,7vw,4.5rem)] text-center`}>
        <p className="mb-2 mt-0 text-[1.125rem] uppercase tracking-[2px] text-muted">
          the protocol
        </p>
        <h1 className="m-0 font-display text-[clamp(3rem,6.5vw,5.75rem)] font-bold leading-[1.05]">
          Work the problem as if you{" "}
          <span className="text-accent underline decoration-[5px] underline-offset-[0.4rem]">
            won&apos;t
          </span>{" "}
          solve it.
        </h1>
        <p className="mx-auto mb-0 mt-5 max-w-[38rem] text-[1.25rem] leading-[1.55] text-muted">
          Then the goal is no longer the answer. It is a record of how you
          read the problem, which Competitor lays next to an expert&apos;s.
        </p>
      </section>

      <section className={`${WRAP} pt-6`}>
        {STEPS.map((s, i) => (
          <div
            key={s.numeral}
            className={`grid grid-cols-[3.5rem_minmax(0,1fr)] gap-4 border-t-2 border-dashed border-rule py-[1.875rem] min-[40rem]:grid-cols-[5.5rem_minmax(0,1fr)] ${
              i === STEPS.length - 1 ? "border-b-2" : ""
            }`}
          >
            <div className="font-display text-[2.75rem] font-bold leading-none">
              {s.numeral}
            </div>
            <div>
              <h3 className="mb-1.5 mt-0 text-[1.5rem]">{s.title}</h3>
              <p className="m-0 text-[1.1875rem] leading-[1.6]">{s.body}</p>
              <div className="mt-2 text-[1.0625rem] italic text-muted">{s.example}</div>
            </div>
          </div>
        ))}
      </section>

      <section className={`${WRAP} pb-5 pt-14`}>
        <article className="relative rotate-[-0.4deg] bg-card p-10 text-center shadow-[2px_3px_0_rgba(43,38,34,0.12)]">
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-[-14px] ml-[-60px] h-7 w-[120px] rotate-[2deg] bg-[rgba(214,196,150,0.7)]"
          />
          <div className="mb-[1.125rem] font-display text-[2.5rem] font-bold leading-none">
            Then photograph your pages
          </div>
          <Pill variant="primary" href="/createProblem">
            Start an analysis
          </Pill>
        </article>
      </section>

      <section className={`${WRAP} pb-24 pt-10`}>
        <h2 className="mb-2.5 mt-0 font-display text-[2.5rem] font-bold leading-none">
          Why this works
        </h2>
        <p className="m-0 text-[1.1875rem] leading-[1.65]">
          Explaining each step in your own words forces you to notice what you
          actually used and what you merely skimmed. Reading the whole problem
          before solving stops the first idea from swallowing the constraints.
          Over time the phrases you once ignored become the cues you check
          first.
        </p>
      </section>
    </div>
  );
}
