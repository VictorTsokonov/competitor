import Link from "next/link";

const STEPS = [
  {
    n: "1",
    title: "Mark the phrases",
    body: "Underline each phrase in the problem and write what it suggests.",
    example: "Example: circling “n+1” and noting “one more than the boxes”.",
  },
  {
    n: "2",
    title: "Say what it is about",
    body: "In one sentence, say what the problem is about before any maths.",
    example: "Example: “This is about forcing a pair, not finding one.”",
  },
  {
    n: "3",
    title: "Define the objects",
    body: "Write down the objects, what is given and what is wanted.",
    example: "Example: “Given S of size n+1; wanted a, b with gcd 1.”",
  },
  {
    n: "4",
    title: "List candidate methods",
    body: "List 2-3 methods with the phrase that triggered each and why you keep or drop it.",
    example: "Example: “Pigeonhole, triggered by n+1 into n pairs; kept.”",
  },
  {
    n: "5",
    title: "Attempt",
    body: "Attempt the problem with your chosen method.",
    example: "Example: “Assume the pairs; take n+1 numbers and see.”",
  },
];

export default function Guide() {
  return (
    <main>
      <div className="mx-auto max-w-3xl px-6">
        <header className="py-16 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-muted">
            The protocol
          </p>
          <h1 className="mt-4 text-5xl font-bold leading-tight tracking-tight md:text-6xl">
            Assume you will get this <span className="text-hollow">wrong</span>.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted">
            Most attempts fail at the reading, not the maths. This protocol
            makes every idea anchor to a phrase in the problem.
          </p>
        </header>

        <div className="space-y-4">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="flex gap-5 rounded-[16px] bg-surface p-6"
            >
              <span className="text-4xl font-bold text-accent">{s.n}</span>
              <div>
                <h2 className="font-semibold">{s.title}</h2>
                <p className="mt-1">{s.body}</p>
                <p className="mt-1 text-sm text-muted">{s.example}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-[16px] bg-surface bg-dots p-8 text-center">
          <p className="text-xl font-semibold">Then photograph your pages</p>
          <Link
            href="/dashboard"
            className="mt-4 inline-block rounded-full bg-accent px-6 py-3 font-semibold text-white"
          >
            Start an analysis
          </Link>
        </div>

        <section className="py-12">
          <h2 className="text-2xl font-bold tracking-tight">Why this works</h2>
          <p className="mt-3">
            Explaining each step in your own words forces you to notice what
            you actually used and what you merely skimmed. Reading the whole
            problem before solving stops the first idea from swallowing the
            constraints. Over time the phrases you once ignored become the
            cues you check first.
          </p>
        </section>
      </div>
    </main>
  );
}
