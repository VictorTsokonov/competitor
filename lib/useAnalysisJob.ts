"use client";

// One client-side pipeline job per creation/submission: an optional
// statement transcription, then the expert pass (cache-skipped) and the
// attempt read in parallel. The hook owns the fetches, stage states and
// all persistence (library statement, analysis cache, Analysed flip);
// the page updates its view through the handlers, which only fire while
// that problem is still the one on screen (the page decides).

import { useRef, useState } from "react";
import type { Analysis, AttemptReport, Chain } from "./schema";
import type { PageImage } from "./pages";
import { compareChains } from "./compare";
import { loadCachedAnalysis, saveCachedAnalysis } from "./analysisCache";
import {
  loadLibrary,
  saveLibrary,
  setProblemState,
  setProblemStatement,
  type StoredProblem,
} from "./problems";

export type StagePhase = "skipped" | "pending" | "running" | "done" | "error";
export type Stage = { phase: StagePhase; message?: string };
export type JobStageKey = "transcribe" | "expert" | "attempt";

export type AttemptOutcome = { student: Chain; report: AttemptReport };

export type AnalysisJob = {
  problemId: string;
  startedAt: number;
  runAnalysis: boolean;
  transcribe: Stage;
  expert: Stage;
  attempt: Stage;
  statementPages: PageImage[];
  attemptPages: PageImage[];
};

export function mergeAnalysis(expertAnalysis: Analysis, attempt: AttemptOutcome): Analysis {
  return {
    ...expertAnalysis,
    student: attempt.student,
    attempt_report: attempt.report,
    comparison: compareChains(expertAnalysis.expert, attempt.student),
  };
}

function libraryChanged(): void {
  window.dispatchEvent(new Event("competitor:library-changed"));
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? "request failed");
  return res.json() as Promise<T>;
}

function message(e: unknown): string {
  return e instanceof Error ? e.message : "request failed";
}

export function useAnalysisJob(handlers: {
  onStatement: (problem: StoredProblem) => void;
  onExpert: (problemId: string, analysis: Analysis) => void;
  onAttempt: (problemId: string, outcome: AttemptOutcome) => void;
  onAnalysed: (problemId: string) => void;
}) {
  const [job, setJob] = useState<AnalysisJob | null>(null);
  const resultsRef = useRef<{
    problemId: string;
    expert?: Analysis;
    attempt?: AttemptOutcome;
  }>({ problemId: "" });
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const setStage = (key: JobStageKey, stage: Stage) =>
    setJob((j) => (j ? { ...j, [key]: stage } : j));

  // Everything landed: cache the full analysis and flip the problem to
  // Analysed. Runs no matter where the user navigated meanwhile.
  function finishIfComplete(problem: StoredProblem, withAttempt: boolean) {
    const r = resultsRef.current;
    if (r.problemId !== problem.id || !r.expert) return;
    if (withAttempt && !r.attempt) return;
    const full = withAttempt && r.attempt ? mergeAnalysis(r.expert, r.attempt) : r.expert;
    saveCachedAnalysis(localStorage, problem.id, full);
    if (withAttempt) {
      saveLibrary(localStorage, setProblemState(loadLibrary(localStorage), problem.id, "analysed"));
      libraryChanged();
      handlersRef.current.onAnalysed(problem.id);
    }
  }

  async function runTranscribe(
    problem: StoredProblem,
    pages: PageImage[]
  ): Promise<StoredProblem> {
    setStage("transcribe", { phase: "running" });
    try {
      const { text } = await postJson<{ text: string }>("/api/read", {
        purpose: "statement",
        pages: pages.map((p) => p.dataUrl),
      });
      saveLibrary(localStorage, setProblemStatement(loadLibrary(localStorage), problem.id, text));
      libraryChanged();
      const updated: StoredProblem = { ...problem, latex: text, state: "unsolved" };
      setStage("transcribe", { phase: "done" });
      handlersRef.current.onStatement(updated);
      return updated;
    } catch (e: unknown) {
      setStage("transcribe", { phase: "error", message: message(e) });
      throw e;
    }
  }

  function runExpert(problem: StoredProblem, withAttempt: boolean) {
    const cached = loadCachedAnalysis(localStorage, problem.id, problem.latex);
    if (cached) {
      resultsRef.current.expert = cached;
      setStage("expert", { phase: "done" });
      handlersRef.current.onExpert(problem.id, cached);
      finishIfComplete(problem, withAttempt);
      return;
    }
    setStage("expert", { phase: "running" });
    postJson<Analysis>("/api/analyse", {
      problemId: problem.id,
      problemText: problem.latex,
    })
      .then((d) => {
        resultsRef.current.expert = d;
        saveCachedAnalysis(localStorage, problem.id, d);
        setStage("expert", { phase: "done" });
        handlersRef.current.onExpert(problem.id, d);
        finishIfComplete(problem, withAttempt);
      })
      .catch((e: unknown) => setStage("expert", { phase: "error", message: message(e) }));
  }

  function runAttempt(problem: StoredProblem, pages: PageImage[]) {
    setStage("attempt", { phase: "running" });
    postJson<AttemptOutcome>("/api/read", {
      purpose: "attempt",
      problemId: problem.id,
      problemText: problem.latex,
      pages: pages.map((p) => p.dataUrl),
    })
      .then((r) => {
        resultsRef.current.attempt = r;
        setStage("attempt", { phase: "done" });
        handlersRef.current.onAttempt(problem.id, r);
        finishIfComplete(problem, true);
      })
      .catch((e: unknown) => setStage("attempt", { phase: "error", message: message(e) }));
  }

  // runAnalysis false = "create and solve later": transcription only.
  function startJob(
    problem: StoredProblem,
    statementPages: PageImage[],
    attemptPages: PageImage[],
    runAnalysis: boolean
  ) {
    resultsRef.current = { problemId: problem.id };
    const withAttempt = runAnalysis && attemptPages.length > 0;
    setJob({
      problemId: problem.id,
      startedAt: Date.now(),
      runAnalysis,
      transcribe: { phase: statementPages.length > 0 ? "pending" : "skipped" },
      expert: { phase: runAnalysis ? "pending" : "skipped" },
      attempt: { phase: withAttempt ? "pending" : "skipped" },
      statementPages,
      attemptPages,
    });
    void (async () => {
      let p = problem;
      if (statementPages.length > 0) {
        try {
          p = await runTranscribe(problem, statementPages);
        } catch {
          return; // stage shows the error; retry resumes the chain
        }
      }
      if (!runAnalysis) return;
      runExpert(p, withAttempt);
      if (withAttempt) runAttempt(p, attemptPages);
    })();
  }

  function retryStage(key: JobStageKey) {
    if (!job) return;
    const problem = loadLibrary(localStorage).problems.find((p) => p.id === job.problemId);
    if (!problem) return;
    const withAttempt = job.runAnalysis && job.attemptPages.length > 0;
    if (key === "transcribe") {
      startJob(problem, job.statementPages, job.attemptPages, job.runAnalysis);
    } else if (key === "expert") {
      runExpert(problem, withAttempt);
    } else {
      runAttempt(problem, job.attemptPages);
    }
  }

  const jobActive = !!job &&
    ([job.transcribe, job.expert, job.attempt] as Stage[]).some(
      (s) => s.phase === "pending" || s.phase === "running" || s.phase === "error"
    );

  return { job, jobActive, startJob, retryStage, results: resultsRef };
}
