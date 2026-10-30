import Image from "next/image";
import Link from "next/link";

const EXAMPLE_SRC = "/guide/example.jpg";

function Crop({
  position,
  alt,
}: {
  position: string;
  alt: string;
}) {
  return (
    <div className="relative mt-3 h-36 overflow-hidden rounded-[16px] bg-surface">
      <Image
        src={EXAMPLE_SRC}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, 672px"
        style={{ objectFit: "none", objectPosition: position }}
      />
    </div>
  );
}

const STEPS = [
  {
    n: "1",
    title: "Mark the phrases",
    body: "Underline each phrase that makes you pause, then number every mark in order. Pen only, one mark per phrase, and keep marks from crossing.",
    example: "Marks ① ② ③ in the example: each underline sits under one load-bearing phrase.",
    crop: { position: "30% 35%", alt: "Close-up of numbered underlines 1, 2 and 3" },
  },
  {
    n: "2",
    title: "Say what it is about",
    body: "In one sentence, say what the problem is about before any maths. This is the sentence the analysis compares against the expert's goal.",
    example: "Mark ③ in the example doubles as the goal: one colour reaches 15.",
    crop: { position: "30% 46%", alt: "Close-up of the goal phrase" },
  },
  {
    n: "3",
    title: "Define the objects",
    body: "Write down what is given and what is wanted in the margin, in your own words. Short notes beat full sentences.",
    example: "The “Definitions” box in the example: guarantee and worst case in the student's own words.",
    crop: { position: "72% 50%", alt: "Close-up of the definitions box" },
  },
  {
    n: "4",
    title: "List candidate methods",
    body: "List 2-3 methods with the phrase that triggered each and why you keep or drop it. Name the trigger, not just the method.",
    example: "The “Methods” list in the example: each method names its trigger phrase and a keep/drop verdict.",
    crop: { position: "45% 85%", alt: "Close-up of the method list" },
  },
  {
    n: "5",
    title: "Attempt, then photograph",
    body: "Attempt the problem with your chosen method. Try small cases, box the final answer, then photograph the whole page lying flat in even light with every number readable.",
    example: "This whole page is the photo: flat, fully in frame, every number readable.",
    crop: { position: "50% 50%", alt: "Wide view of the whole example page" },
  },
];

const TRANSCRIPT = [
  "A box contains 28 red, 20 green, 19 yellow, 13 blue, 11 white and 9 black balls. Minimum drawn without replacement to guarantee at least 15 of a single color? (2019 AMC 12A #3.)",
  "① “minimum number drawn without replacement” — how many draws are we counting?",
  "② “to guarantee” — the strategy must survive the worst draw order.",
  "③ “at least 15 of a single color” — the goal: one colour reaches 15.",
  "Definitions: guarantee = works against the worst draw; worst case = avoid 15 as long as possible.",
  "Trap note: only 9 black exist, so black can never reach 15.",
  "Methods: worst-case construction (triggered by “guarantee”), KEEP; 14-of-each-plus-one (triggered by “15”), DROP — black caps at 9.",
  "No answer on the page: the reading stops at method setup.",
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

        <section aria-label="Worked example" className="rounded-[16px] bg-surface p-6">
          <h2 className="text-xl font-bold">What a good page looks like</h2>
          <p className="mt-1 text-muted">
            A real AMC problem, prepared the way the analysis expects:
            numbered marks, written-out definitions, interpretation notes,
            and a method list — stopping before any solving.
          </p>
          <div className="relative mt-4 overflow-hidden rounded-[16px]">
            <Image
              src={EXAMPLE_SRC}
              alt="Handwritten reading-phase example for an AMC counting problem: three numbered underlines, a definitions box, a trap note about the black balls, and a method list with keep and drop verdicts"
              width={1920}
              height={1280}
              sizes="(max-width: 768px) 100vw, 672px"
              className="h-auto w-full"
            />
          </div>
          <p className="mt-2 text-xs text-muted">
            Problem © Mathematical Association of America, 2019 AMC 12A #3.
          </p>
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-semibold">
              Read a transcript of the example
            </summary>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
              {TRANSCRIPT.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </details>
        </section>

        <div className="mt-6 space-y-4">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="rounded-[16px] bg-surface p-6"
            >
              <div className="flex gap-5">
                <span className="text-4xl font-bold text-accent">{s.n}</span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold">{s.title}</h2>
                  <p className="mt-1">{s.body}</p>
                  <p className="mt-1 text-sm text-muted">
                    In the example: {s.example}
                  </p>
                </div>
              </div>
              <Crop position={s.crop.position} alt={s.crop.alt} />
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-[16px] bg-surface bg-dots p-8 text-center">
          <p className="text-xl font-semibold">Then photograph your pages</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Whole page flat in the frame, even light, every mark number
            readable. The analysis reads mark positions, not colours.
          </p>
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
