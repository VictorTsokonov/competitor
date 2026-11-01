"use client";

// One client-side pipeline job per creation/submission:
//   transcribe? -> solve -> (expert A+B || attempt C) -> explain -> done
// The solve grounds the expert reading and is skipped when the cache
// already holds a solution for this statement; the explain call writes
// the feedback and degrades to the TypeScript comparison on failure.
// The hook owns the fetches, stage states and all persistence (library
// statement, analysis cache, Analysed flip); the page updates its view
// through the handlers.

import { useRef, useState } from "react";
import type {
  Analysis,
  AttemptReport,
  Chain,
  Comparison,
  Solution,
} from "./schema";
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
export type JobStageKey = "transcribe" | "solve" | "expert" | "attempt" | "explain";

export type AttemptOutcome = { student: Chain; report: AttemptReport };

export type AnalysisJob = {
  problemId: string;
  startedAt: number;
  runAnalysis: boolean;
  transcribe: Stage;
  solve: Stage;
  expert: Stage;
  attempt: Stage;
  explain: Stage;
  statementPages: PageImage[];
  attemptPages: PageImage[];
};

export function mergeAnalysis(
  expertAnalysis: Analysis,
  attempt: AttemptOutcome,
  comparison?: Comparison
): Analysis {
  return {
    ...expertAnalysis,
    student: attempt.student,
    attempt_report: attempt.report,
    comparison: comparison ?? compareChains(expertAnalysis.expert, attempt.student),
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

type JobResults = {
  problemId: string;
  // null: no solver (mock mode) — proceed ungrounded. undefined: not run.
  solution?: Solution | null;
  expert?: Analysis;
  attempt?: AttemptOutcome;
  explain?: Comparison;
};

export function useAnalysisJob(handlers: {
  onStatement: (problem: StoredProblem) => void;
  onExpert: (problemId: string, analysis: Analysis) => void;
  onAttempt: (problemId: string, outcome: AttemptOutcome) => void;
  onExplain: (problemId: string, comparison: Comparison) => void;
  onAnalysed: (problemId: string) => void;
}) {
  const [job, setJob] = useState<AnalysisJob | null>(null);
  const resultsRef = useRef<JobResults>({ problemId: "" });
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const setStage = (key: JobStageKey, stage: Stage) =>
    setJob((j) => (j ? { ...j, [key]: stage } : j));

  function cacheMerged(problem: StoredProblem): Analysis | null {
    const r = resultsRef.current;
    if (r.problemId !== problem.id || !r.expert || !r.attempt) return null;
    const merged = mergeAnalysis(r.expert, r.attempt, r.explain);
    saveCachedAnalysis(localStorage, problem.id, merged);
    return merged;
  }

  function markAnalysed(problem: StoredProblem) {
    saveLibrary(
      localStorage,
      setProblemState(loadLibrary(localStorage), problem.id, "analysed")
    );
    libraryChanged();
    handlersRef.current.onAnalysed(problem.id);
  }

  // The feedback pass: runs once expert and attempt are both in. Its
  // failure leaves the TypeScript comparison in place (already cached),
  // so the panel never goes empty — the stage just offers a retry.
  function runExplain(problem: StoredProblem) {
    const r = resultsRef.current;
    if (r.problemId !== problem.id || !r.expert || !r.attempt) return;
    const expert = r.expert;
    const attempt = r.attempt;
    setStage("explain", { phase: "running" });
    postJson<{ comparison: Comparison }>("/api/explain", {
      problemText: expert.problem.text,
      problemId: problem.id,
      expert: expert.expert,
      student: attempt.student,
      report: attempt.report,
      solution: r.solution ?? null,
    })
      .then(({ comparison }) => {
        r.explain = comparison;
        setStage("explain", { phase: "done" });
        handlersRef.current.onExplain(problem.id, comparison);
        cacheMerged(problem);
      })
      .catch((e: unknown) =>
        setStage("explain", { phase: "error", message: message(e) })
      );
  }

  // Both model readings landed: cache (TS comparison first — upgraded in
  // place when the explain call returns), flip to Analysed, explain.
  function finishIfComplete(problem: StoredProblem, withAttempt: boolean) {
    const r = resultsRef.current;
    if (r.problemId !== problem.id || !r.expert) return;
    if (!withAttempt) {
      saveCachedAnalysis(localStorage, problem.id, r.expert);
      return;
    }
    if (!r.attempt) return;
    cacheMerged(problem);
    markAnalysed(problem);
    runExplain(problem);
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
      saveLibrary(
        localStorage,
        setProblemStatement(loadLibrary(localStorage), problem.id, text)
      );
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

  // Call S. A cached analysis for this exact statement already carries
  // its solution, so revisits and resubmits never re-solve; mock mode
  // returns null and the pipeline proceeds ungrounded.
  async function runSolve(problem: StoredProblem): Promise<void> {
    const r = resultsRef.current;
    const cached = loadCachedAnalysis(localStorage, problem.id, problem.latex);
    if (cached) {
      r.solution = cached.solution ?? null;
      setStage("solve", { phase: "done" });
      return;
    }
    setStage("solve", { phase: "running" });
    try {
      const { solution } = await postJson<{ solution: Solution | null }>(
        "/api/solve",
        { problemText: problem.latex }
      );
      r.solution = solution;
      setStage("solve", { phase: "done" });
    } catch (e: unknown) {
      setStage("solve", { phase: "error", message: message(e) });
      throw e;
    }
  }

  function runExpert(problem: StoredProblem, withAttempt: boolean) {
    const r = resultsRef.current;
    const cached = loadCachedAnalysis(localStorage, problem.id, problem.latex);
    if (cached) {
      r.expert = cached;
      setStage("expert", { phase: "done" });
      handlersRef.current.onExpert(problem.id, cached);
      finishIfComplete(problem, withAttempt);
      return;
    }
    setStage("expert", { phase: "running" });
    postJson<Analysis>("/api/analyse", {
      problemId: problem.id,
      problemText: problem.latex,
      solution: r.solution ?? null,
    })
      .then((d) => {
        r.expert = d;
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
      solve: { phase: runAnalysis ? "pending" : "skipped" },
      expert: { phase: runAnalysis ? "pending" : "skipped" },
      attempt: { phase: withAttempt ? "pending" : "skipped" },
      explain: { phase: withAttempt ? "pending" : "skipped" },
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
      try {
        await runSolve(p);
      } catch {
        return;
      }
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
    } else if (key === "solve") {
      void (async () => {
        try {
          await runSolve(problem);
        } catch {
          return;
        }
        runExpert(problem, withAttempt);
        if (withAttempt) runAttempt(problem, job.attemptPages);
      })();
    } else if (key === "expert") {
      runExpert(problem, withAttempt);
    } else if (key === "attempt") {
      runAttempt(problem, job.attemptPages);
    } else {
      runExplain(problem);
    }
  }

  const jobActive =
    !!job &&
    ([job.transcribe, job.solve, job.expert, job.attempt, job.explain] as Stage[]).some(
      (s) => s.phase === "pending" || s.phase === "running" || s.phase === "error"
    );

  return { job, jobActive, startJob, retryStage, results: resultsRef };
}
