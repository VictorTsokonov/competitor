"use client";

import { useEffect, useState } from "react";
import type { Analysis } from "@/lib/schema";
import { loadLibrary, SELECT_INTENT_KEY, type StoredProblem } from "@/lib/problems";
import WorkspaceShell from "@/components/WorkspaceShell";
import ComparisonPanel from "@/components/ComparisonPanel";
import CreateProblemForm from "@/components/CreateProblemForm";
import LatexCheatsheet from "@/components/LatexCheatsheet";
import ProblemText from "@/components/ProblemText";
import { RichTex } from "@/components/StageCard";
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
  const [stored, setStored] = useState<StoredProblem | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  function select(problemId?: string) {
    if (problemId) {
      const lib = loadLibrary(localStorage);
      setStored(lib.problems.find((p) => p.id === problemId) ?? null);
      setData(null);
      setStatus(null);
      setActionStatus(null);
      return;
    }
    load();
  }

  function handleCreated(id: string) {
    window.dispatchEvent(new Event("competitor:library-changed"));
    select(id);
  }

  // Selection intent handed off from /createProblem: consume once, then
  // clear. A missing problem means staying on creation, never a crash.
  useEffect(() => {
    try {
      const id = sessionStorage.getItem(SELECT_INTENT_KEY);
      if (id) {
        sessionStorage.removeItem(SELECT_INTENT_KEY);
        const lib = loadLibrary(localStorage);
        if (lib.problems.some((p) => p.id === id)) select(id);
      }
    } catch {
      /* private mode: stay on creation */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function analyseStored() {
    if (!stored) return;
    setActionStatus("Analysing…");
    fetch("/api/analyse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problemText: stored.latex }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error ?? "request failed");
        return res.json();
      })
      .then(() => setActionStatus(null))
      .catch((e: Error) => setActionStatus(e.message));
  }

  function load() {
    setStored(null);
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

  const creation = !data && !stored;
  return (
    <WorkspaceShell
      onSelectProblem={select}
      selectedProblemId={stored?.id}
      creationActive={creation}
      right={
        data || stored ? (
          data ? (
            <ComparisonPanel data={data} />
          ) : (
            <p className="w-80 px-5 py-8 text-sm text-muted">
              Comparison will appear here.
            </p>
          )
        ) : (
          <LatexCheatsheet />
        )
      }
    >
      <div className="mx-auto w-full max-w-[760px] leading-[1.6]">
            {stored && !data ? (
              <div className="border-b border-line pb-12">
                <h2 className="text-2xl font-bold tracking-tight">{stored.name}</h2>
                <div className="mt-4 leading-[1.6]">
                  <RichTex tex={stored.latex} />
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    onClick={analyseStored}
                    className="rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white"
                  >
                    Analyse problem
                  </button>
                  <button
                    onClick={() =>
                      setActionStatus(
                        "Photo upload for your solutions arrives with call C — nothing to submit through yet."
                      )
                    }
                    className="rounded-full bg-surface px-6 py-2 text-sm font-semibold"
                  >
                    Submit solution
                  </button>
                </div>
                {actionStatus && (
                  <p role="status" className="mt-3 text-sm text-muted">{actionStatus}</p>
                )}
              </div>
            ) : data && expert ? (
              <>
                <div className="border-b border-line pb-12">
                  <ProblemText text={data.problem.text} spans={expert.spans} />
                </div>
                <ResponseCard label="Stage 1 · Reading" sourceKey="reading" title="Reading" divider={false}>
                  <ResponseReading reading={expert.reading} spans={expert.spans} />
                </ResponseCard>
                <ResponseCard label="Stage 2 · Goal" sourceKey="goal" title="Goal">
                  <ResponseGoal goal={expert.goal} />
                </ResponseCard>
                <ResponseCard label="Stage 3 · Informal cues" sourceKey="informal" title="Informal cues">
                  <ResponseInformalCues informal_cues={expert.informal_cues} spans={expert.spans} />
                </ResponseCard>
                <ResponseCard label="Stage 4 · Abstraction" sourceKey="abstraction" title="Abstraction">
                  <ResponseAbstraction abstraction={expert.abstraction} />
                </ResponseCard>
                <ResponseCard label="Stage 5 · Simplification" sourceKey="simplification" title="Simplification">
                  <ResponseSimplification simplification={expert.simplification} />
                </ResponseCard>
                <ResponseCard label="Stage 6 · Method" sourceKey="method" title="Method">
                  <ResponseMethod method={expert.method} spans={expert.spans} />
                  <div className="border-t border-line pt-4">
                    <p className="text-sm font-semibold">Prerequisites</p>
                    <div className="mt-2">
                      <ResponsePrerequisites
                        prerequisites={expert.prerequisites}
                      />
                    </div>
                  </div>
                </ResponseCard>
                <ResponseCard label="Stage 7 · Second reading" sourceKey="second_reading" title="Second reading">
                  <ResponseSecondReading second_reading={expert.second_reading} spans={expert.spans} />
                </ResponseCard>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold tracking-tight">New problem</h1>
                <p className="mt-2 text-muted">
                  {status ??
                    "Create your first problem here, or pick one from the library."}
                </p>
                <CreateProblemForm onSaved={handleCreated} />
              </>
            )}
      </div>
    </WorkspaceShell>
  );
}
