"use client";

// What the dashboard's centre is on, kept in step with the library: the
// selected problem, or the "solve later" creation card. The last viewed
// problem and the card are restored per tab, so navigating away and back
// returns to them (and to the job's progress, if one runs); a library change (a statement
// landed, the problem turned Analysed, got its name, or was renamed or
// deleted in Sets) refreshes it. An analysed problem no job holds loads
// its reading: the cache first (it holds the merged student reading and
// skips re-running the expert), then the API for a cleared cache. Demo
// examples always come from the API, with their recorded pages.

import { useEffect, useRef, useState } from "react";
import type { Analysis } from "@/lib/schema";
import type { PageImage } from "@/lib/pages";
import { loadCachedAnalysis, saveCachedAnalysis } from "@/lib/analysisCache";
import type { ExampleSummary } from "@/lib/demoExamples";
import { getJob } from "@/lib/jobStore";
import { postJson } from "@/lib/postJson";
import {
  LAST_CARD_KEY,
  LAST_VIEW_KEY,
  problemLabel,
  type LibraryState,
  type StoredProblem,
} from "@/lib/problems";
import { useAppMode, type ModeStorage } from "@/lib/useAppMode";

// A recorded example's attempt pages, served from public/examples/<n>/.
function examplePages(example: ExampleSummary): PageImage[] {
  return example.pages.map((url) => ({
    id: url,
    dataUrl: url,
    href: url,
    label: example.source,
  }));
}

function remember(session: ModeStorage, key: string, problemId: string | null): void {
  try {
    if (problemId) session.setItem(key, problemId);
    else session.removeItem(key);
  } catch {
    /* private mode: view resets on navigation */
  }
}

function rememberView(session: ModeStorage, problemId: string | null): void {
  remember(session, LAST_VIEW_KEY, problemId);
}

export function useSelection() {
  const { mode, examples, local, session, readLibrary } = useAppMode();
  const demo = mode === "demo";
  const [stored, setStored] = useState<StoredProblem | null>(null);
  const [label, setLabel] = useState("");
  // The reading of an analysed problem no job holds.
  const [loaded, setLoaded] = useState<Analysis | null>(null);
  // Its loading line, or why it failed to load.
  const [status, setStatus] = useState<string | null>(null);
  // The attempt form's pages, or a recorded example's.
  const [pages, setPages] = useState<PageImage[]>([]);
  // The problem whose "solve later" card replaces the creation form.
  const [card, setCardState] = useState<string | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  // Bumped by every fresh view, so a reading load still in flight from an
  // earlier view (an earlier click on the same problem, or one since
  // re-analysed) is never shown.
  const loadToken = useRef(0);

  function setCard(problemId: string | null) {
    setCardState(problemId);
    remember(session, LAST_CARD_KEY, problemId);
  }

  // Shows problem (null: the creation state) with a fresh view.
  function show(problem: StoredProblem | null, lib: LibraryState) {
    loadToken.current++;
    selectedIdRef.current = problem?.id ?? null;
    setStored(problem);
    setLabel(problem ? problemLabel(lib, problem) : "");
    setLoaded(null);
    setStatus(null);
    setPages([]);
    rememberView(session, problem?.id ?? null);
  }

  function select(problemId?: string) {
    const lib = readLibrary();
    const problem = lib.problems.find((p) => p.id === problemId) ?? null;
    show(problem, lib);
    if (!problem) return;
    const example = examples.find((e) => e.id === problem.id);
    if (example) setPages(examplePages(example));
    // A problem's job holds whatever already landed for it.
    if (problem.state !== "analysed" || getJob(problem.id)) return;
    const cached = demo ? null : loadCachedAnalysis(local, problem.id, problem.latex);
    if (cached) {
      setLoaded(cached);
      return;
    }
    setStatus("Loading analysis…");
    const token = loadToken.current;
    postJson<Analysis>("/api/analyse", { problemId: problem.id, problemText: problem.latex })
      .then((d) => {
        // Cached even if the student moved on, unless the problem has
        // since been re-analysed (Unsolved, or a new job runs it).
        const now = readLibrary().problems.find((p) => p.id === problem.id);
        const current = now?.state === "analysed" && now.latex === problem.latex;
        if (!demo && current && !getJob(problem.id)) saveCachedAnalysis(local, problem.id, d);
        if (loadToken.current !== token) return;
        setLoaded(d);
        setStatus(null);
      })
      .catch((e: unknown) => {
        if (loadToken.current !== token) return;
        setStatus(`Failed to load: ${e instanceof Error ? e.message : "request failed"}`);
      });
  }

  // Missing problems mean staying on creation, never a crash.
  useEffect(() => {
    try {
      const problems = readLibrary().problems;
      const cardId = session.getItem(LAST_CARD_KEY);
      if (cardId && problems.some((p) => p.id === cardId)) setCardState(cardId);
      const id = session.getItem(LAST_VIEW_KEY);
      if (id && problems.some((p) => p.id === id)) select(id);
    } catch {
      /* private mode: stay on creation */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function refresh() {
      const lib = readLibrary();
      const exists = (id: string | null) => !!id && lib.problems.some((p) => p.id === id);
      setCardState((id) => (exists(id) ? id : null));
      try {
        if (!exists(session.getItem(LAST_CARD_KEY))) session.removeItem(LAST_CARD_KEY);
      } catch {
        /* private mode */
      }
      const id = selectedIdRef.current;
      if (!id) return;
      const problem = lib.problems.find((p) => p.id === id);
      if (problem) {
        setStored(problem);
        setLabel(problemLabel(lib, problem));
        return;
      }
      loadToken.current++;
      selectedIdRef.current = null;
      setStored(null);
      setLoaded(null);
      setStatus(null);
      setPages([]);
      rememberView(session, null);
    }
    window.addEventListener("competitor:library-changed", refresh);
    return () => window.removeEventListener("competitor:library-changed", refresh);
  }, [readLibrary, session]);

  return { stored, label, loaded, status, pages, setPages, card, setCard, select, show };
}
