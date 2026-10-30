"use client";

import { useEffect, useState } from "react";
import type { Analysis } from "@/lib/schema";
import {
  LAST_VIEW_KEY,
  loadLibrary,
  problemLabel,
  saveLibrary,
  SELECT_INTENT_KEY,
  setProblemState,
  type StoredProblem,
} from "@/lib/problems";
import AppShell from "@/components/layout/AppShell";
import Pill from "@/components/ui/Pill";
import ComparisonPanel from "@/components/comparison/ComparisonPanel";
import CreateProblemForm from "@/components/create/CreateProblemForm";
import AttemptSection from "@/components/create/AttemptSection";
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
  const [label, setLabel] = useState<string>("");
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  function rememberView(problemId: string | null) {
    try {
      if (problemId) sessionStorage.setItem(LAST_VIEW_KEY, problemId);
      else sessionStorage.removeItem(LAST_VIEW_KEY);
    } catch {
      /* private mode: view resets on navigation */
    }
  }

  function requestAnalysis(problem: StoredProblem): Promise<Analysis> {
    return fetch("/api/analyse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problemId: problem.id, problemText: problem.latex }),
    }).then(async (res) => {
      if (!res.ok) throw new Error((await res.json()).error ?? "request failed");
      return res.json() as Promise<Analysis>;
    });
  }

  function select(problemId?: string) {
    setData(null);
    setStatus(null);
    setActionStatus(null);
    if (!problemId) {
      setStored(null);
      rememberView(null);
      return;
    }
    const lib = loadLibrary(localStorage);
    const problem = lib.problems.find((p) => p.id === problemId) ?? null;
    setStored(problem);
    setLabel(problem ? problemLabel(lib, problem) : "");
    rememberView(problem?.id ?? null);
    // Analysed problems ship or persist with a reading: load it straight away.
    if (problem && problem.state === "analysed") {
      setStatus("Loading analysis…");
      requestAnalysis(problem)
        .then((d) => {
          setData(d);
          setStatus(null);
        })
        .catch((e: Error) => setStatus(`Failed to load: ${e.message}`));
    }
  }

  function handleCreated(id: string) {
    window.dispatchEvent(new Event("competitor:library-changed"));
    select(id);
  }

  // Selection intent handed off from /createProblem wins; otherwise the
  // last viewed problem is restored so navigating away and back returns
  // here, not to the default creation state. Missing problems mean
  // staying on creation, never a crash.
  useEffect(() => {
    try {
      const lib = loadLibrary(localStorage);
      const intent = sessionStorage.getItem(SELECT_INTENT_KEY);
      if (intent) sessionStorage.removeItem(SELECT_INTENT_KEY);
      const id = intent ?? sessionStorage.getItem(LAST_VIEW_KEY);
      if (id && lib.problems.some((p) => p.id === id)) select(id);
    } catch {
      /* private mode: stay on creation */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Bundled problems have a mock reading and switch to Analysed; anything
  // else gets the honest mock-mode message in place, never a crash.
  function submitAttempt() {
    if (!stored) return;
    setActionStatus("Analysing…");
    requestAnalysis(stored)
      .then((d) => {
        const lib = setProblemState(loadLibrary(localStorage), stored.id, "analysed");
        saveLibrary(localStorage, lib);
        window.dispatchEvent(new Event("competitor:library-changed"));
        setStored({ ...stored, state: "analysed" });
        setData(d);
        setActionStatus(null);
      })
      .catch((e: Error) => setActionStatus(e.message));
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
        data || stored ? <ComparisonPanel data={data} /> : <LatexReference />
      }
      centre={
        <div className="mx-auto w-full max-w-[48rem] text-[1.1875rem] leading-[1.65]">
          {stored && !data ? (
            <div>
              <h2 className="font-display text-[2.5rem] font-bold leading-none">
                {stored.name}
              </h2>
              <div className="mb-[30px] mt-4">
                <RichTex tex={stored.latex} />
              </div>
              {stored.state === "analysed" ? (
                <p role="status" className="text-[1.0625rem] text-muted">
                  {status ?? "Loading analysis…"}
                </p>
              ) : (
                <>
                  <AttemptSection />
                  <Pill
                    variant="primary"
                    onClick={submitAttempt}
                    className="min-h-[42px] text-[1.0625rem]"
                  >
                    Submit attempt
                  </Pill>
                  {actionStatus && (
                    <p role="status" className="mt-3 text-[1.0625rem] text-muted">
                      {actionStatus}
                    </p>
                  )}
                </>
              )}
            </div>
          ) : data && expert ? (
            <>
              <ProblemReading data={data} label={label || stored?.name || ""} />
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
