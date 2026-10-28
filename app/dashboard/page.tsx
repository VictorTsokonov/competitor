"use client";

import { useEffect, useState } from "react";
import type { Analysis } from "@/lib/schema";
import Heatmap from "@/components/Heatmap";
import ExpertChain from "@/components/ExpertChain";

export default function Dashboard() {
  const [data, setData] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSolution, setShowSolution] = useState(false);

  useEffect(() => {
    fetch("/api/analyse", { method: "POST" })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error ?? "request failed");
        return res.json();
      })
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error)
    return <main className="p-8 text-ink">Failed to load: {error}</main>;
  if (!data) return <main className="p-8 text-ink">Loading analysis…</main>;

  const expert = data.expert;
  const cueLabel = (id: string) =>
    expert.cues.find((c) => c.id === id)?.span ?? id;

  return (
    <main className="min-h-screen bg-background text-ink">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 p-6 lg:grid-cols-12">
        <aside className="lg:col-span-3">
          <div className="rounded-[16px] bg-surface p-5">
            <h2 className="mb-4 text-lg font-semibold">Analyses</h2>
            <p className="mb-4 rounded-[16px] bg-background p-3 text-sm">
              {data.problem}
            </p>
            <button className="w-full rounded-[16px] bg-accent px-4 py-2 text-sm font-semibold text-white">
              New analysis
            </button>
          </div>
        </aside>

        <section className="space-y-6 lg:col-span-6">
          <h1 className="text-xl font-semibold">{data.problem}</h1>
          <div className="rounded-[16px] border-2 border-dashed border-line p-6 text-center text-sm">
            <p className="font-semibold">Upload your written attempt</p>
            <p className="mt-1">Photo upload coming soon</p>
            <input type="file" disabled className="mt-3 text-sm" />
          </div>

          <ExpertChain expert={expert} />
        </section>

        <aside className="space-y-6 lg:col-span-3">
          <div className="rounded-[16px] bg-surface p-5">
            <Heatmap
              text={data.problem}
              spans={expert.problem_spans}
              label="Expert"
            />
          </div>
          <div className="rounded-[16px] bg-surface p-5">
            <Heatmap
              text={data.problem}
              spans={data.student.problem_spans}
              label="You"
            />
          </div>
          <div className="panel-divergence rounded-[16px] p-5">
            <h2 className="mb-2 text-sm font-semibold">First divergence</h2>
            <p className="text-sm">{data.comparison.first_divergence}</p>
          </div>
          <div className="rounded-[16px] bg-surface p-5">
            <h2 className="mb-2 text-sm font-semibold">Missed cues</h2>
            <ul className="list-disc pl-5 text-sm">
              {data.comparison.missed_cues.map((id) => (
                <li key={id}>
                  {id} — <span className="font-mono">“{cueLabel(id)}”</span>
                </li>
              ))}
            </ul>
          </div>
          <button
            onClick={() => setShowSolution((v) => !v)}
            className="w-full rounded-[16px] bg-accent px-4 py-2 text-sm font-semibold text-white"
          >
            Reveal solution
          </button>
          {showSolution && (
            <div className="rounded-[16px] bg-surface p-5 text-sm">
              Full solution reveal coming soon.
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
