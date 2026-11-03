"use client";

// The pipeline jobs, one per problem, held outside React: a job keeps
// running, and keeps persisting what lands, while the dashboard shows
// another problem or is unmounted by client-side navigation to / or
// /guide. Components read one immutable snapshot through useJobs; every
// change replaces it, so its reference moves only when something did.
// While any job runs, reloading or closing the tab asks first, and each
// job's record (lib/jobRecord.ts) says whether it was still running.

import { useSyncExternalStore } from "react";
import { clearJobRecord, updateJobRecord } from "./jobRecord";
import {
  isRunning,
  keepsRecord,
  withStage,
  type AnalysisJob,
  type JobStageKey,
  type Stage,
} from "./jobTypes";
import type { ModeStorage } from "./useAppMode";

export type JobsSnapshot = Readonly<Record<string, AnalysisJob>>;
// The job a pipeline step belongs to: its problem and the token it started with.
export type JobRef = { problemId: string; token: string };

// The server renders no jobs.
const NO_JOBS: JobsSnapshot = {};
let snapshot: JobsSnapshot = NO_JOBS;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): JobsSnapshot {
  return snapshot;
}

function getServerSnapshot(): JobsSnapshot {
  return NO_JOBS;
}

export function useJobs(): JobsSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// The browser shows its own "leave site?" prompt; the text can't be set.
function confirmLeave(e: BeforeUnloadEvent): void {
  e.preventDefault();
  e.returnValue = "";
}

let guarding = false;

function guardUnload(): void {
  const running = Object.values(snapshot).some(isRunning);
  if (running === guarding) return;
  guarding = running;
  if (running) window.addEventListener("beforeunload", confirmLeave);
  else window.removeEventListener("beforeunload", confirmLeave);
}

function publish(next: JobsSnapshot): void {
  snapshot = next;
  guardUnload();
  listeners.forEach((listener) => listener());
}

export function getJob(problemId: string): AnalysisJob | undefined {
  return snapshot[problemId];
}

// The job ref started, while it is still its problem's job.
export function currentJob(ref: JobRef): AnalysisJob | null {
  const job = snapshot[ref.problemId];
  return job && job.token === ref.token ? job : null;
}

export function putJob(job: AnalysisJob): void {
  publish({ ...snapshot, [job.problemId]: job });
}

// The record follows the job: running while it runs, not once it stops.
function syncRecord(before: AnalysisJob, after: AnalysisJob): void {
  const running = isRunning(after);
  if (keepsRecord(after) && running !== isRunning(before)) {
    updateJobRecord(after.storage, after.problemId, after.statement, { running });
  }
}

// Applies change to ref's job; a stale ref changes nothing and gets null.
export function patchJob(
  ref: JobRef,
  change: (job: AnalysisJob) => AnalysisJob
): AnalysisJob | null {
  const before = currentJob(ref);
  if (!before) return null;
  const after = change(before);
  syncRecord(before, after);
  publish({ ...snapshot, [ref.problemId]: after });
  return after;
}

export function setStage(ref: JobRef, key: JobStageKey, stage: Stage): AnalysisJob | null {
  return patchJob(ref, (job) => withStage(job, key, stage));
}

function removeJob(problemId: string): AnalysisJob | undefined {
  const job = snapshot[problemId];
  if (!job) return undefined;
  const next = { ...snapshot };
  delete next[problemId];
  publish(next);
  return job;
}

// After a failure, back to the attempt form: the job goes (anything still
// in flight lands nowhere). Its record keeps the private solution and any
// finished expert reading, so resubmitting skips those; the attempt read
// lives only on the job and runs again.
export function startOver(problemId: string): void {
  const job = removeJob(problemId);
  if (job && keepsRecord(job)) {
    updateJobRecord(job.storage, problemId, job.statement, { running: false });
  }
}

// Re-analyse, or the problem was deleted: the job and its record go.
export function discardJob(storage: ModeStorage, problemId: string): void {
  removeJob(problemId);
  clearJobRecord(storage, problemId);
}
