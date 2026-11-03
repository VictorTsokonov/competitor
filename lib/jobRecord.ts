// What a pipeline job has finished, kept in this mode's localStorage as it
// lands, so a reload or a closed tab costs only the unfinished stages:
// call S's private solution, and the latest expert reading with the step
// that produced it. The record also says whether a job was running, so the
// dashboard can tell the student honestly that the last analysis was cut
// off. Keyed by problem id and tied to the statement by its hash;
// validated on read; the newest few are kept. Cleared when the problem
// turns Analysed and on Re-analyse. Live mode only, like the cache.

import { z } from "zod";
import { AnalysisSchema, SolutionSchema } from "./schema";
import { loadCachedAnalysis, statementHash } from "./analysisCache";
import type { KeyValueStorage } from "./problems";
import type { ExpertStep } from "./providers/types";

const KEY = "jobs.v1";
const MAX_ENTRIES = 12;

const JobRecordSchema = z.object({
  hash: z.string(),
  savedAt: z.number(),
  running: z.boolean(),
  solution: SolutionSchema.nullable().optional(),
  reading: z
    .object({ step: z.enum(["first", "second", "audit"]), analysis: AnalysisSchema })
    .optional(),
});

export type JobRecord = z.infer<typeof JobRecordSchema>;
type JobRecordPatch = Partial<Pick<JobRecord, "running" | "solution" | "reading">>;

function readRecords(storage: KeyValueStorage): Record<string, unknown> {
  try {
    const raw = storage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function savedAt(entry: unknown): number {
  const at = (entry as { savedAt?: unknown } | null)?.savedAt;
  return typeof at === "number" ? at : 0;
}

// A stored entry, if it is a valid record for this statement.
function parseRecord(entry: unknown, statement: string): JobRecord | null {
  const parsed = JobRecordSchema.safeParse(entry);
  if (!parsed.success || parsed.data.hash !== statementHash(statement)) return null;
  const { reading } = parsed.data;
  if (reading && reading.analysis.problem.text !== statement.trim()) {
    return { ...parsed.data, reading: undefined };
  }
  return parsed.data;
}

export function loadJobRecord(
  storage: KeyValueStorage,
  problemId: string,
  statement: string
): JobRecord | null {
  return parseRecord(readRecords(storage)[problemId], statement);
}

// Merges the patch into this statement's record, starting a fresh one
// when there is none or the statement changed.
export function updateJobRecord(
  storage: KeyValueStorage,
  problemId: string,
  statement: string,
  patch: JobRecordPatch
): void {
  try {
    const records = readRecords(storage);
    const before = parseRecord(records[problemId], statement);
    records[problemId] = {
      ...(before ?? { running: false }),
      ...patch,
      hash: statementHash(statement),
      savedAt: Date.now(),
    };
    const keep = Object.entries(records)
      .sort(([, a], [, b]) => savedAt(b) - savedAt(a))
      .slice(0, MAX_ENTRIES);
    storage.setItem(KEY, JSON.stringify(Object.fromEntries(keep)));
  } catch {
    /* storage unavailable or full: a reload just runs every stage again */
  }
}

export function clearJobRecord(storage: KeyValueStorage, problemId: string): void {
  try {
    const records = readRecords(storage);
    if (!(problemId in records)) return;
    delete records[problemId];
    storage.setItem(KEY, JSON.stringify(records));
  } catch {
    /* storage unavailable: nothing to clear */
  }
}

const KEPT_READING: Record<ExpertStep, string> = {
  first: "the expert's first reading",
  second: "the expert's second reading",
  audit: "the checked reading",
};

// A job was still running when the page went away (reload, closed tab):
// what it had finished, for the dashboard's note (shown only when no job
// for the problem is alive in this tab). null: no job was running.
export function interruptedRun(
  storage: KeyValueStorage,
  problemId: string,
  statement: string
): { kept: string[] } | null {
  const record = loadJobRecord(storage, problemId, statement);
  if (!record?.running) return null;
  const cached = loadCachedAnalysis(storage, problemId, statement);
  const kept: string[] = [];
  if (cached ? cached.solution : record.solution) kept.push("the private solution");
  if (cached) kept.push("the expert's finished reading");
  else if (record.reading) kept.push(KEPT_READING[record.reading.step]);
  return { kept };
}
