import Header from "@/components/layout/Header";
import Pill from "@/components/ui/Pill";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />

      <section className="mx-auto max-w-[72rem] px-[clamp(1.25rem,6vw,5.5rem)] pb-[clamp(3rem,8vw,6.5rem)] pt-[clamp(3rem,9vw,7rem)] text-center">
        <h1 className="m-0 font-display text-[clamp(4.5rem,13vw,11.5rem)] font-bold leading-none tracking-[0.02em]">
          C<span className="text-accent">∅</span>mpetitor
        </h1>
        <p className="mx-auto mb-0 mt-2 font-display text-[clamp(2rem,4.5vw,3.75rem)] font-bold leading-[1.15]">
          <span className="line-through decoration-accent decoration-4">
            Stop solving.
          </span>{" "}
          Start <span className="text-accent">reading.</span>
        </p>
        <svg
          aria-hidden="true"
          viewBox="0 0 600 30"
          preserveAspectRatio="none"
          className="mx-auto mb-0 mt-1 block h-5 w-[min(26rem,70%)]"
        >
          <path
            d="M8 20 C 120 6, 260 26, 380 12 S 560 10, 592 16"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </svg>
        <div className="mt-11 flex flex-wrap justify-center gap-4">
          <Pill variant="primary" href="/dashboard">
            Try the demo
          </Pill>
          <Pill href="#how">How it works</Pill>
        </div>
      </section>

      <section
        id="how"
        className="mx-auto max-w-[72rem] px-[clamp(1.25rem,6vw,5.5rem)] pb-[clamp(4rem,9vw,7.5rem)]"
      >
        <h2 className="mb-3 mt-0 text-center font-display text-[clamp(2.25rem,4vw,2.875rem)] font-bold">
          How it works
        </h2>
        <p className="mx-auto mb-5 mt-0 max-w-[40rem] text-center text-[1.25rem] leading-[1.55]">
          Competitor trains the part of problem-solving that happens{" "}
          <em>before</em> any calculation or proof: reading the statement,
          noticing which phrases carry the weight, and deciding what
          mathematics they point to.
        </p>
        <p className="m-0 text-center text-[1.1875rem]">
          <Link href="/guide" className="font-bold">
            Read the full guide →
          </Link>
        </p>
      </section>

      <footer className="mx-auto flex max-w-[72rem] flex-wrap justify-end gap-4 border-t-2 border-dashed border-rule px-[clamp(1.25rem,6vw,5.5rem)] pb-12 pt-8 text-[1.0625rem] text-muted">
        <span className="flex gap-6">
          <Link href="/guide">Guide</Link>
          <a href="#">About</a>
          <a href="#">Privacy</a>
        </span>
      </footer>
    </div>
  );
}
