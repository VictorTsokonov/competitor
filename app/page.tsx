import Link from "next/link";
import Heatmap from "@/components/Heatmap";
import Accordion from "@/components/Accordion";
import GlyphSphere from "@/components/GlyphSphere";
import dummyData from "@/lib/dummy-data.json";

const ITEMS = [
  {
    title: "Read before you solve",
    body: "Every phrase is weighted by how much thinking it drew.",
  },
  {
    title: "Compare cue by cue",
    body: "Your reading beside the expert's, down to the first divergence.",
  },
  {
    title: "Learn your blind spots",
    body: "Missed cues logged by type, so patterns surface.",
  },
];

export default function Home() {
  return (
    <main>
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden text-center">
        <GlyphSphere />
        <div className="relative z-10 mx-auto max-w-4xl px-6 py-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-muted">
            For Putnam and ICMC competitors
          </p>
          <h1 className="mt-4 text-6xl font-bold leading-none tracking-tight md:text-8xl">
            Stop solving.
            <br />
            Start <span className="text-hollow">reading</span>.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">
            A maths tutor that never gives the solution. It compares how you
            read a problem with how an expert reads it, cue by cue.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="rounded-full bg-accent px-6 py-3 font-semibold text-white"
            >
              Try the demo
            </Link>
            <Link
              href="/guide"
              className="rounded-full bg-surface px-6 py-3 font-semibold"
            >
              How it works
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <h2 className="mb-8 text-3xl font-bold tracking-tight">
          How Competitor reads a problem
        </h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-[16px] bg-surface p-6">
            <Heatmap
              text={dummyData.problem}
              spans={dummyData.expert.problem_spans}
              label="Expert reading"
            />
          </div>
          <Accordion items={ITEMS} />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <h2 className="mb-8 text-3xl font-bold tracking-tight">
          The protocol in one line
        </h2>
        <div className="rounded-[16px] bg-surface p-8 text-center">
          <p className="text-xl font-semibold">
            Assume you will get this wrong. Then explain every step.
          </p>
          <Link
            href="/guide"
            className="mt-3 inline-block font-semibold text-accent hover:underline"
          >
            Read the guide
          </Link>
        </div>
      </section>

      <footer className="border-t border-line px-6 py-8 text-center text-sm text-muted">
        Competitor, built for the Meta Global AI Developer Hackathon 2026.
      </footer>
    </main>
  );
}
