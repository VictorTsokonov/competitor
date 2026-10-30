"use client";

import { useEffect, useState } from "react";
import type { Analysis } from "@/lib/schema";
import { loadLibrary, SELECT_INTENT_KEY, type StoredProblem } from "@/lib/problems";
import AppShell from "@/components/layout/AppShell";
import Pill from "@/components/ui/Pill";
import ComparisonPanel from "@/components/comparison/ComparisonPanel";
import CreateProblemForm from "@/components/create/CreateProblemForm";
import LatexReference from "@/components/latex/LatexReference";
import ProblemReading from "@/components/reading/ProblemReading";
import StageSection from "@/components/reading/StageSection";
import Reading from "@/components/reading/Reading";
import Goal from "@/components/reading/Goal";
import InformalCues from "@/components/reading/InformalCues";
import Abstraction from "@/components/reading/Abstraction";
import Simplification from "@/components/reading/Simplification";
import Method from "@/components/reading/Method";
import Prerequisites from "@/components/reading/Prerequisites";
import SecondReading from "@/components/reading/SecondReading";
import { RichTex } from "@/components/reading/Tex";

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

  const comparing = !!(data || stored);
  return (
    <AppShell
      onSelectProblem={select}
      selectedProblemId={stored?.id}
      rightLabel={comparing ? "comparison" : "LaTeX reference"}
      leftFooter={
        <Pill href="/createProblem" className="min-h-[42px] w-full text-[1.0625rem]">
          + New problem
        </Pill>
      }
      right={
        data || stored ? (
          data ? (
            <ComparisonPanel data={data} />
          ) : (
            <p className="w-full px-[1.375rem] pb-7 pt-[0.875rem] text-[1.0625rem] text-muted">
              Comparison will appear here.
            </p>
          )
        ) : (
          <LatexReference />
        )
      }
      centre={
        <div className="mx-auto w-full max-w-[48rem] text-[1.1875rem] leading-[1.65]">
          {stored && !data ? (
            <div>
              <h2 className="font-display text-[2.5rem] font-bold leading-none">
                {stored.name}
              </h2>
              <div className="mt-4">
                <RichTex tex={stored.latex} />
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Pill
                  variant="primary"
                  onClick={analyseStored}
                  className="min-h-[42px] text-[1.0625rem]"
                >
                  Analyse problem
                </Pill>
                <Pill
                  onClick={() =>
                    setActionStatus(
                      "Photo upload for your solutions arrives with call C — nothing to submit through yet."
                    )
                  }
                  className="min-h-[42px] text-[1.0625rem]"
                >
                  Submit solution
                </Pill>
              </div>
              {actionStatus && (
                <p role="status" className="mt-3 text-[1.0625rem] text-muted">
                  {actionStatus}
                </p>
              )}
            </div>
          ) : data && expert ? (
            <>
              <ProblemReading
                data={data}
                label={stored?.name ?? "ICMC 2020 · Problem 1"}
              />
              <StageSection index="1" title="Reading" sourceKey="reading">
                <Reading reading={expert.reading} spans={expert.spans} />
              </StageSection>
              <StageSection index="2" title="Goal" sourceKey="goal">
                <Goal goal={expert.goal} />
              </StageSection>
              <StageSection index="3" title="Informal cues" sourceKey="informal">
                <InformalCues
                  informal_cues={expert.informal_cues}
                  spans={expert.spans}
                />
              </StageSection>
              <StageSection index="4" title="Abstraction" sourceKey="abstraction">
                <Abstraction abstraction={expert.abstraction} />
              </StageSection>
              <StageSection index="5" title="Simplification" sourceKey="simplification">
                <Simplification simplification={expert.simplification} />
              </StageSection>
              <StageSection index="6" title="Method" sourceKey="method">
                <Method method={expert.method} spans={expert.spans} />
              </StageSection>
              <StageSection index="7" title="Prerequisites">
                <Prerequisites prerequisites={expert.prerequisites} />
              </StageSection>
              <StageSection index="8" title="Second reading" sourceKey="second_reading">
                <SecondReading
                  second_reading={expert.second_reading}
                  spans={expert.spans}
                />
              </StageSection>
            </>
          ) : (
            <>
              {status && (
                <p role="status" className="mb-4 text-muted">
                  {status}
                </p>
              )}
              <CreateProblemForm onSaved={handleCreated} />
            </>
          )}
        </div>
      }
    />
  );
}
