"use client";

import { useState } from "react";
import type { Analysis } from "@/lib/schema";
import SetsPanel from "@/components/SetsPanel";
import ComparisonPanel from "@/components/ComparisonPanel";
import ProblemText from "@/components/ProblemText";
import ResponseCard from "@/components/ResponseCard";
import ResponseReading from "@/components/ResponseReading";
import ResponseGoal from "@/components/ResponseGoal";
import ResponseInformalCues from "@/components/ResponseInformalCues";
import ResponseAbstraction from "@/components/ResponseAbstraction";
import ResponseSimplification from "@/components/ResponseSimplification";
import ResponseMethod from "@/components/ResponseMethod";
import ResponsePrerequisites from "@/components/ResponsePrerequisites";
import ResponseSecondReading from "@/components/ResponseSecondReading";

export default function Dashboard() {
  const [data, setData] = useState<Analysis | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  function load() {
    setStatus("Loading analysis…");
    fetch("/api/analyse", { method: "POST" })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error ?? "request failed");
        return res.json();
      })
      .then((d: Analysis) => {
        setData(d);
        setStatus(null);
      })
      .catch((e: Error) => setStatus(`Failed to load: ${e.message}`));
  }

  const expert = data?.expert;

  return (
    <main className="min-h-screen bg-background text-ink">
      <div className="mx-auto flex max-w-[1440px] items-stretch">
        <div className="shrink-0 border-r border-line">
          <SetsPanel onSelectProblem={load} />
        </div>

        <div className="min-w-0 flex-1 px-6 py-10">
          <div className="mx-auto w-full max-w-[760px] leading-[1.6]">
            {data && expert ? (
              <>
                <div className="border-b border-line pb-12">
                  <ProblemText text={data.problem.text} spans={expert.spans} />
                </div>
                <ResponseCard label="Stage 1 · Reading" title="Reading" divider={false}>
                  <ResponseReading reading={expert.reading} spans={expert.spans} />
                </ResponseCard>
                <ResponseCard label="Stage 2 · Goal" title="Goal">
                  <ResponseGoal goal={expert.goal} />
                </ResponseCard>
                <ResponseCard label="Stage 3 · Informal cues" title="Informal cues">
                  <ResponseInformalCues informal_cues={expert.informal_cues} spans={expert.spans} />
                </ResponseCard>
                <ResponseCard label="Stage 4 · Abstraction" title="Abstraction">
                  <ResponseAbstraction abstraction={expert.abstraction} />
                </ResponseCard>
                <ResponseCard label="Stage 5 · Simplification" title="Simplification">
                  <ResponseSimplification simplification={expert.simplification} />
                </ResponseCard>
                <ResponseCard label="Stage 6 · Method" title="Method">
                  <ResponseMethod method={expert.method} spans={expert.spans} />
                </ResponseCard>
                <ResponseCard label="Stage 7 · Prerequisites" title="Prerequisites">
                  <ResponsePrerequisites prerequisites={expert.prerequisites} />
                </ResponseCard>
                <ResponseCard label="Stage 8 · Second reading" title="Second reading">
                  <ResponseSecondReading second_reading={expert.second_reading} spans={expert.spans} />
                </ResponseCard>
              </>
            ) : (
              <p className="py-20 text-center text-muted">
                {status ?? "Select ICMC 2020 / Problem 1 from your sets to begin."}
              </p>
            )}
          </div>
        </div>

        <div className="shrink-0 border-l border-line">
          {data ? (
            <ComparisonPanel data={data} />
          ) : (
            <p className="w-80 px-5 py-8 text-sm text-muted">
              Comparison will appear here.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
