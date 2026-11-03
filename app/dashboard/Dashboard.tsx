"use client";

// The dashboard: what the centre and the comparison panel show for the
// selection (components/dashboard/useSelection.ts), and the actions on it:
// create, submit an attempt, retry, start over, re-analyse. The pipeline
// runs in the job store (lib/jobStore.ts), one job per problem, so it
// outlives this page and never blocks other work.

import { useMemo, useState } from "react";
import type { Analysis } from "@/lib/schema";
import { clearCachedAnalysis } from "@/lib/analysisCache";
import { mergeAnalysis } from "@/lib/compare";
import { autoNameProblem } from "@/lib/autoName";
import { interruptedRun } from "@/lib/jobRecord";
import { retryStage, startJob } from "@/lib/jobPipeline";
import { discardJob, startOver, useJobs } from "@/lib/jobStore";
import { isRunning } from "@/lib/jobTypes";
import {
  createProblem,
  PLACEHOLDER_NAME,
  provisionalName,
  saveLibrary,
  setProblemState,
} from "@/lib/problems";
import { useAppMode } from "@/lib/useAppMode";
import AppShell from "@/components/layout/AppShell";
import Pill from "@/components/ui/Pill";
import ComparisonPanel from "@/components/comparison/ComparisonPanel";
import CreateProblemForm, {
  type CreateRequest,
} from "@/components/create/CreateProblemForm";
import DemoNote from "@/components/create/DemoNote";
import LatexReference from "@/components/latex/LatexReference";
import CreationCard from "@/components/dashboard/CreationCard";
import ProblemCentre from "@/components/dashboard/ProblemCentre";
import { useSelection } from "@/components/dashboard/useSelection";

function libraryChanged(): void {
  window.dispatchEvent(new Event("competitor:library-changed"));
}

export default function Dashboard() {
  // Demo: the recorded examples, read-only, nothing reaches the model.
  // Live: this browser's own library and the full pipeline.
  const { mode, examples, local, readLibrary } = useAppMode();
  const demo = mode === "demo";
  const jobs = useJobs();
  const { stored, label, loaded, status, pages, setPages, card, setCard, select, show } =
    useSelection();
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  const job = stored ? jobs[stored.id] : undefined;
  const running = !!job && isRunning(job);

  function open(problemId?: string) {
    setActionStatus(null);
    select(problemId);
  }

  // Both creation workflows, never blocked by another job: the problem
  // exists in the library at once (a photographed one in state "creating"
  // until its transcription lands), with a provisional name the model's
  // title replaces; "submit" opens it and runs the whole pipeline,
  // "later" stays on a progress card and only transcribes.
  function handleCreate(req: CreateRequest) {
    if (demo) return;
    const created = createProblem(readLibrary(), {
      name:
        req.name ??
        (req.writtenText ? provisionalName(req.writtenText) : PLACEHOLDER_NAME),
      latex: req.writtenText ?? "",
      state: req.writtenText ? "unsolved" : "creating",
    });
    saveLibrary(local, created.state);
    libraryChanged();
    const problem = created.problem;
    // A photographed statement is named once it is read (lib/jobPipeline.ts).
    if (req.writtenText && !req.name) {
      void autoNameProblem(local, problem.id, req.writtenText);
    }
    const start = { storage: local, problem, statementPages: req.statementPages };
    if (req.mode === "later") {
      setCard(problem.id);
      if (req.statementPages.length > 0) {
        startJob({ ...start, attemptPages: [], runAnalysis: false });
      }
      return;
    }
    setActionStatus(null);
    setCard(null);
    show(problem, created.state);
    startJob({ ...start, attemptPages: req.attemptPages, runAnalysis: true });
  }

  function submitAttempt() {
    if (!stored || running || demo) return;
    if (pages.length === 0) {
      setActionStatus("Add at least one page of your attempt first.");
      return;
    }
    setActionStatus(null);
    const problem = readLibrary().problems.find((p) => p.id === stored.id) ?? stored;
    startJob({ storage: local, problem, statementPages: [], attemptPages: pages, runAnalysis: true });
  }

  // After a failure: back to the attempt form with the same pages. The
  // private solution and any finished expert reading are kept; the pages
  // are read again on resubmitting, since the student may change them.
  function handleStartOver() {
    if (!stored) return;
    setPages(job?.attemptPages ?? []);
    setActionStatus(null);
    startOver(stored.id);
  }

  // Re-analyse: forget the job, its record and the cached reading, and
  // flip back to Unsolved so the next submission runs the whole pipeline
  // fresh (attempt pages are never stored, so the student resubmits them).
  function reanalyse() {
    if (!stored || running || demo) return;
    discardJob(local, stored.id);
    clearCachedAnalysis(local, stored.id);
    const lib = setProblemState(readLibrary(), stored.id, "unsolved");
    saveLibrary(local, lib);
    libraryChanged();
    setActionStatus(null);
    show(lib.problems.find((p) => p.id === stored.id) ?? { ...stored, state: "unsolved" }, lib);
  }

  // What the page renders: the job's final expert reading with its student
  // reading merged in (the explain call's feedback once it has landed, the
  // TypeScript comparison until then), or the reading loaded for a
  // problem no job holds.
  const analysis: Analysis | null = useMemo(() => {
    if (!job) return loaded;
    if (!job.expert) return null;
    return job.attempt ? mergeAnalysis(job.expert, job.attempt, job.explain) : job.expert;
  }, [job, loaded]);

  // An Unsolved problem whose last run was cut off by a reload or a closed
  // tab, with no job running it in this tab now.
  const interrupted = useMemo(
    () =>
      !demo && stored?.state === "unsolved" && !job
        ? interruptedRun(local, stored.id, stored.latex)
        : null,
    [demo, stored, job, local]
  );

  const comparing = !!(analysis || stored);
  const example = demo && stored ? examples.find((e) => e.id === stored.id) : undefined;
  return (
    <AppShell
      onSelectProblem={open}
      selectedProblemId={stored?.id}
      rightLabel={comparing ? "comparison" : "LaTeX reference"}
      leftFooter={
        <Pill
          onClick={() => {
            setCard(null);
            open(undefined);
          }}
          className="min-h-[42px] w-full text-[1.0625rem]"
        >
          + New problem
        </Pill>
      }
      right={
        comparing ? (
          <ComparisonPanel
            data={analysis}
            pages={job && job.attemptPages.length > 0 ? job.attemptPages : pages}
            attemptPhase={
              job && job.attemptPages.length > 0 ? job.stages.attempt.phase : undefined
            }
            explain={
              job
                ? {
                    phase: job.stages.explain.phase,
                    message: job.stages.explain.message,
                    onRetry: () => retryStage(job.problemId, "explain"),
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
            // Keyed by problem, so a page conversion still running for one
            // problem's attempt form never lands in the next one's.
            <ProblemCentre
              key={stored.id}
              problem={stored}
              label={label || stored.name}
              note={example && `${example.source} · ${example.recorded}`}
              analysis={analysis}
              job={job}
              demo={demo}
              status={status}
              interrupted={interrupted}
              attempt={{ pages, onPages: setPages, onSubmit: submitAttempt, status: actionStatus }}
              onRetry={(key) => retryStage(stored.id, key)}
              onStartOver={handleStartOver}
              onReanalyse={reanalyse}
            />
          ) : card ? (
            <CreationCard
              job={jobs[card]}
              onRetry={(key) => retryStage(card, key)}
              onOpen={() => {
                setCard(null);
                open(card);
              }}
              onDismiss={() => setCard(null)}
            />
          ) : demo ? (
            <DemoNote />
          ) : (
            <CreateProblemForm onCreate={handleCreate} />
          )}
        </div>
      }
    />
  );
}
