import { AnalysisSchema, type Analysis } from "./schema";
import type { KeyValueStorage } from "./problems";

// Client-side cache of analyses keyed by problem id, so selecting an
// analysed problem or resubmitting an attempt never re-runs call A for an
// unchanged statement. Entries are validated on read and the newest few
// are kept; the attempt page images are never stored.
const KEY = "competitor.analyses.v1";
const MAX_ENTRIES = 12;

type Entry = { hash: string; savedAt: number; analysis: unknown };
type Cache = Record<string, Entry>;

// djb2 — tiny, and enough to notice an edited statement.
function hashText(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) {
    h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  }
  return h.toString(36);
}

function readCache(storage: KeyValueStorage): Cache {
  try {
    const raw = storage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return typeof parsed === "object" && parsed !== null ? (parsed as Cache) : {};
  } catch {
    return {};
  }
}

export function loadCachedAnalysis(
  storage: KeyValueStorage,
  problemId: string,
  problemText: string
): Analysis | null {
  const entry = readCache(storage)[problemId];
  if (!entry || entry.hash !== hashText(problemText)) return null;
  const parsed = AnalysisSchema.safeParse(entry.analysis);
  return parsed.success ? parsed.data : null;
}

// Re-analyse: drop this problem's entry so the next submission runs the
// full pipeline instead of being served the cached reading.
export function clearCachedAnalysis(storage: KeyValueStorage, problemId: string): void {
  try {
    const cache = readCache(storage);
    if (!(problemId in cache)) return;
    delete cache[problemId];
    storage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* storage unavailable: nothing to clear */
  }
}

export function saveCachedAnalysis(
  storage: KeyValueStorage,
  problemId: string,
  analysis: Analysis
): void {
  try {
    const cache = readCache(storage);
    cache[problemId] = {
      hash: hashText(analysis.problem.text),
      savedAt: Date.now(),
      analysis,
    };
    const keep = Object.entries(cache)
      .sort(([, a], [, b]) => b.savedAt - a.savedAt)
      .slice(0, MAX_ENTRIES);
    storage.setItem(KEY, JSON.stringify(Object.fromEntries(keep)));
  } catch {
    /* storage unavailable or full: next visit refetches */
  }
}
