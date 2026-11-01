"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Analysis, Comparison } from "@/lib/schema";
import type { PageImage } from "@/lib/pages";
import { loadCachedAnalysis, saveCachedAnalysis } from "@/lib/analysisCache";
import {
  mergeAnalysis,
  useAnalysisJob,
  type AnalysisJob,
  type AttemptOutcome,
  type JobStageKey,
} from "@/lib/useAnalysisJob";
import {
  createProblem,
  LAST_VIEW_KEY,
  loadLibrary,
  problemLabel,
  saveLibrary,
  SELECT_INTENT_KEY,
  type StoredProblem,
} from "@/lib/problems";
import AppShell from "@/components/layout/AppShell";
import Pill from "@/components/ui/Pill";
import ComparisonPanel from "@/components/comparison/ComparisonPanel";
import CreateProblemForm, {
  type CreateRequest,
} from "@/components/create/CreateProblemForm";
import AttemptSection from "@/components/create/AttemptSection";
import PipelineProgress, {
  type PipelineView,
} from "@/components/create/PipelineProgress";
import LatexReference from "@/components/latex/LatexReference";
import ProblemReading from "@/components/reading/ProblemReading";
import AttemptNotice, {
  type AttemptCallState,
} from "@/components/reading/AttemptNotice";
import ExpertStages from "@/components/reading/ExpertStages";
import { RichTex } from "@/components/reading/Tex";

function pipelineView(
  job: AnalysisJob,
  retryStage: (key: JobStageKey) => void
): PipelineView {
  const pages = job.attemptPages.length;
  const stage = (key: JobStageKey, label: string) => ({
    key,
    label,
    stage: job[key],
    onRetry: () => retryStage(key),
  });
  return {
    startedAt: job.startedAt,
    stages: [
      stage("transcribe", "Reading the problem from your screenshot"),
      stage("solve", "Expert is solving the problem — kept private, it grounds the reading"),
      stage("expert", "Expert is reading the problem"),
      stage("attempt", `Reading your attempt (${pages} page${pages === 1 ? "" : "s"})`),
      stage("explain", "Writing your feedback"),
    ],
  };
}

export default function Dashboard() {
  const [data, setData] = useState<Analysis | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [stored, setStored] = useState<StoredProblem | null>(null);
  const [label, setLabel] = useState<string>("");
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [pages, setPages] = useState<PageImage[]>([]);
  const [attempt, setAttempt] = useState<AttemptOutcome | null>(null);
  const [explained, setExplained] = useState<Comparison | null>(null);
  // Workflow "create and solve later": the id whose progress card replaces
  // the creation form until dismissed.
  const [creationCard, setCreationCard] = useState<string | null>(null);
  const selectedIdRef = useRef<string | null>(null);

  const { job, jobActive, startJob, retryStage, results } = useAnalysisJob({
    onStatement: (problem) => {
      if (selectedIdRef.current === problem.id) setStored(problem);
    },
    onExpert: (problemId, analysis) => {
      if (selectedIdRef.current === problemId) setData(analysis);
    },
    onAttempt: (problemId, outcome) => {
      if (selectedIdRef.current === problemId) setAttempt(outcome);
    },
    onExplain: (problemId, comparison) => {
      if (selectedIdRef.current === problemId) setExplained(comparison);
    },
    onAnalysed: (problemId) => {
      setStored((prev) =>
        prev && prev.id === problemId ? { ...prev, state: "analysed" } : prev
      );
    },
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

  function select(problemId?: string) {
    selectedIdRef.current = problemId ?? null;
    setStatus(null);
    setActionStatus(null);
    if (!problemId) {
      setStored(null);
      setData(null);
      setAttempt(null);
      setExplained(null);
      setPages([]);
      rememberView(null);
      return;
    }
    const lib = loadLibrary(localStorage);
    const problem = lib.problems.find((p) => p.id === problemId) ?? null;
    setStored(problem);
    setLabel(problem ? problemLabel(lib, problem) : "");
    rememberView(problem?.id ?? null);
    // Returning to the problem a job is running on restores what already
    // landed; any other selection starts clean.
    const r = results.current;
    const isJobProblem = job?.problemId === problemId && r.problemId === problemId;
    setData(isJobProblem ? (r.expert ?? null) : null);
    setAttempt(isJobProblem ? (r.attempt ?? null) : null);
    setExplained(isJobProblem ? (r.explain ?? null) : null);
    setPages(isJobProblem && job ? job.attemptPages : []);
    if (isJobProblem) return;
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

  // Both creation workflows: the problem exists in the library at once
  // (a photographed one in state "creating" until its transcription
  // lands); "submit" redirects to it and runs the full pipeline, "later"
  // stays on a progress card and only transcribes.
  function handleCreate(req: CreateRequest) {
    if (jobActive) return;
    const lib = loadLibrary(localStorage);
    const created = createProblem(lib, {
      name: req.name,
      latex: req.writtenText ?? "",
      state: req.writtenText ? "unsolved" : "creating",
    });
    saveLibrary(localStorage, created.state);
    window.dispatchEvent(new Event("competitor:library-changed"));
    const problem = created.problem;
    if (req.mode === "submit") {
      selectedIdRef.current = problem.id;
      setStored(problem);
      setLabel(problemLabel(created.state, problem));
      rememberView(problem.id);
      setData(null);
      setAttempt(null);
      setExplained(null);
      setStatus(null);
      setActionStatus(null);
      setPages(req.attemptPages);
      setCreationCard(null);
      startJob(problem, req.statementPages, req.attemptPages, true);
    } else {
      setCreationCard(problem.id);
      if (req.statementPages.length > 0) {
        startJob(problem, req.statementPages, [], false);
      }
    }
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

  function submitAttempt() {
    if (!stored || jobActive) return;
    if (pages.length === 0) {
      setActionStatus("Add at least one page of your attempt first.");
      return;
    }
    setActionStatus(null);
    startJob(stored, [], pages, true);
  }

  // What the page renders: the expert analysis with this session's
  // student reading merged in — the explain call's feedback once it has
  // landed, the TypeScript comparison until then.
  const analysis: Analysis | null = useMemo(
    () => (data && attempt ? mergeAnalysis(data, attempt, explained ?? undefined) : data),
    [data, attempt, explained]
  );
  const expert = analysis?.expert;

  const jobForStored = job && stored && job.problemId === stored.id ? job : null;
  const jobForCard = job && creationCard === job.problemId ? job : null;
  const cardReady = !jobForCard || jobForCard.transcribe.phase === "done";

  // Call C's state for the notice under the reading, derived from the job.
  const attemptCallState: AttemptCallState =
    jobForStored?.attempt.phase === "running" ||
    jobForStored?.attempt.phase === "pending"
      ? { phase: "loading", pageCount: jobForStored.attemptPages.length }
      : jobForStored?.attempt.phase === "error"
        ? { phase: "error", message: jobForStored.attempt.message ?? "request failed" }
        : { phase: "idle" };

  const comparing = !!(analysis || stored);
  return (
    <AppShell
      onSelectProblem={select}
      selectedProblemId={stored?.id}
      rightLabel={comparing ? "comparison" : "LaTeX reference"}
      leftFooter={
        <Pill
          onClick={() => {
            setCreationCard(null);
            select(undefined);
          }}
          className="min-h-[42px] w-full text-[1.0625rem]"
        >
          + New problem
        </Pill>
      }
      right={
        analysis || stored ? (
          <ComparisonPanel
            data={analysis}
            pages={pages}
            explain={
              jobForStored
                ? {
                    phase: jobForStored.explain.phase,
                    message: jobForStored.explain.message,
                    onRetry: () => retryStage("explain"),
                  }
                : undefined
            }
          />
        ) : (
          <LatexReference />
        )
      }
      centre={
        <div className="mx-auto w-full max-w-[48rem] text-[1.1875rem] leading-[1.65]">
          {stored ? (
            jobForStored && jobActive && !analysis ? (
              <div>
                <h2 className="font-display text-[2.5rem] font-bold leading-none">
                  {stored.name}
                </h2>
                {stored.latex && (
                  <div className="mt-4">
                    <RichTex tex={stored.latex} />
                  </div>
                )}
                <PipelineProgress view={pipelineView(jobForStored, retryStage)} />
              </div>
            ) : analysis && expert ? (
              <>
                <ProblemReading
                  data={analysis}
                  label={label || stored.name}
                />
                <div className="mt-[26px]">
                  <AttemptNotice
                    state={attemptCallState}
                    report={analysis.attempt_report}
                  />
                </div>
                <ExpertStages expert={expert} />
              </>
            ) : stored.state === "creating" ? (
              <div>
                <h2 className="font-display text-[2.5rem] font-bold leading-none">
                  {stored.name}
                </h2>
                <p role="status" className="mt-4 text-[1.0625rem] text-muted">
                  The statement never finished being read — the page was
                  closed mid-creation. Delete this problem in the Sets panel
                  and create it again.
                </p>
              </div>
            ) : stored.state === "analysed" ? (
              <div>
                <h2 className="font-display text-[2.5rem] font-bold leading-none">
                  {stored.name}
                </h2>
                <div className="mb-[30px] mt-4">
                  <RichTex tex={stored.latex} />
                </div>
                <p role="status" className="text-[1.0625rem] text-muted">
                  {status ?? "Loading analysis…"}
                </p>
              </div>
            ) : (
              <div>
                <h2 className="font-display text-[2.5rem] font-bold leading-none">
                  {stored.name}
                </h2>
                <div className="mb-[30px] mt-4">
                  <RichTex tex={stored.latex} />
                </div>
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
              </div>
            )
          ) : creationCard ? (
            <div>
              <h2 className="font-display text-[2.5rem] font-bold leading-none">
                {cardReady ? "Problem ready" : "Problem creation in progress"}
              </h2>
              {jobForCard ? (
                <PipelineProgress view={pipelineView(jobForCard, retryStage)} />
              ) : (
                <p className="mt-4 text-[1.0625rem] text-muted">
                  Saved to Sets — find it in the left panel.
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-3">
                <Pill
                  variant="primary"
                  onClick={() => {
                    const id = creationCard;
                    setCreationCard(null);
                    select(id);
                  }}
                  className="min-h-[42px] text-[1.0625rem]"
                >
                  Go to problem
                </Pill>
                <Pill onClick={() => setCreationCard(null)}>New problem</Pill>
              </div>
            </div>
          ) : (
            <>
              {status && (
                <p role="status" className="mb-4 text-muted">
                  {status}
                </p>
              )}
              <CreateProblemForm onCreate={handleCreate} busy={jobActive} />
            </>
          )}
        </div>
      }
    />
  );
}
