"use client";

import { useEffect, useMemo, useState } from "react";
import type { Analysis, AttemptReport, Chain } from "@/lib/schema";
import type { PageImage } from "@/lib/pages";
import { loadCachedAnalysis, saveCachedAnalysis } from "@/lib/analysisCache";
import { compareChains } from "@/lib/compare";
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
import AttemptNotice, {
  type AttemptCallState,
} from "@/components/reading/AttemptNotice";
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

type AttemptOutcome = { student: Chain; report: AttemptReport };

export default function Dashboard() {
  const [data, setData] = useState<Analysis | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [stored, setStored] = useState<StoredProblem | null>(null);
  const [label, setLabel] = useState<string>("");
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [pages, setPages] = useState<PageImage[]>([]);
  const [attempt, setAttempt] = useState<AttemptOutcome | null>(null);
  const [attemptState, setAttemptState] = useState<AttemptCallState>({
    phase: "idle",
  });

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

  // Call C: the pages go to /api/read and come back as the student's chain
  // plus the structure report, independent of the expert pass.
  function requestAttempt(
    problem: StoredProblem,
    pageList: PageImage[]
  ): Promise<AttemptOutcome> {
    return fetch("/api/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        purpose: "attempt",
        problemId: problem.id,
        problemText: problem.latex,
        pages: pageList.map((p) => p.dataUrl),
      }),
    }).then(async (res) => {
      if (!res.ok) throw new Error((await res.json()).error ?? "request failed");
      return res.json() as Promise<AttemptOutcome>;
    });
  }

  function select(problemId?: string) {
    setData(null);
    setStatus(null);
    setActionStatus(null);
    setPages([]);
    setAttempt(null);
    setAttemptState({ phase: "idle" });
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
    // Analysed problems ship or persist with a reading: the cache first (it
    // holds the merged student reading and skips re-running call A), then
    // the API for bundled problems or a cleared cache.
    if (problem && problem.state === "analysed") {
      const cached = loadCachedAnalysis(localStorage, problem.id, problem.latex);
      if (cached) {
        setData(cached);
        return;
      }
      setStatus("Loading analysis…");
      requestAnalysis(problem)
        .then((d) => {
          setData(d);
          setStatus(null);
          saveCachedAnalysis(localStorage, problem.id, d);
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

  function runAttempt(problem: StoredProblem, pageList: PageImage[]) {
    setAttemptState({ phase: "loading", pageCount: pageList.length });
    requestAttempt(problem, pageList)
      .then((r) => {
        setAttempt(r);
        setAttemptState({ phase: "idle" });
      })
      .catch((e: Error) => setAttemptState({ phase: "error", message: e.message }));
  }

  // Submit runs call A (skipped when cached) and call C in parallel, each
  // with its own status and error; the reading renders as soon as the
  // expert pass lands and the student underlines layer in after.
  function submitAttempt() {
    if (!stored || attemptState.phase === "loading") return;
    if (pages.length === 0) {
      setActionStatus("Add at least one page of your attempt first.");
      return;
    }
    const problem = stored;
    setActionStatus("Running the expert pass…");
    const cached = loadCachedAnalysis(localStorage, problem.id, problem.latex);
    (cached ? Promise.resolve(cached) : requestAnalysis(problem))
      .then((d) => {
        setData(d);
        setActionStatus(null);
      })
      .catch((e: Error) => setActionStatus(`Expert pass failed: ${e.message}`));
    runAttempt(problem, pages);
  }

  // What the page renders: the expert analysis, with this session's
  // extracted student reading merged over its placeholder student chain
  // and the comparison computed in TypeScript (lib/compare.ts).
  const analysis: Analysis | null = useMemo(
    () =>
      data && attempt
        ? {
            ...data,
            student: attempt.student,
            attempt_report: attempt.report,
            comparison: compareChains(data.expert, attempt.student),
          }
        : data,
    [data, attempt]
  );

  // The problem counts as Analysed only once both calls landed; until then
  // a reload returns to Unsolved with the expert pass cached, so a failed
  // attempt read is resubmitted cheaply.
  useEffect(() => {
    if (!stored || !analysis || !attempt) return;
    saveCachedAnalysis(localStorage, stored.id, analysis);
    if (stored.state === "unsolved") {
      const lib = setProblemState(loadLibrary(localStorage), stored.id, "analysed");
      saveLibrary(localStorage, lib);
      window.dispatchEvent(new Event("competitor:library-changed"));
      setStored({ ...stored, state: "analysed" });
    }
  }, [analysis, attempt, stored]);

  const expert = analysis?.expert;

  const retryAttempt =
    stored && pages.length > 0
      ? () => runAttempt(stored, pages)
      : undefined;

  const comparing = !!(analysis || stored);
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
        analysis || stored ? (
          <ComparisonPanel data={analysis} pages={pages} />
        ) : (
          <LatexReference />
        )
      }
      centre={
        <div className="mx-auto w-full max-w-[48rem] text-[1.1875rem] leading-[1.65]">
          {stored && !analysis ? (
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
                  <AttemptSection pages={pages} onPages={setPages} />
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
                  <div className="mt-4">
                    <AttemptNotice state={attemptState} onRetry={retryAttempt} />
                  </div>
                </>
              )}
            </div>
          ) : analysis && expert ? (
            <>
              <ProblemReading
                data={analysis}
                label={label || stored?.name || ""}
              />
              <div className="mt-[26px]">
                <AttemptNotice
                  state={attemptState}
                  report={analysis.attempt_report}
                  onRetry={retryAttempt}
                />
              </div>
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
