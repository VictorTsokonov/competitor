"use client";

import { useEffect, useState } from "react";
import ProblemLibrary from "@/components/ProblemLibrary";
import CreateMenu from "@/components/CreateMenu";
import RailMark from "@/components/RailMark";
import {
  createFolder,
  loadLibrary,
  saveLibrary,
  type LibraryState,
} from "@/lib/problems";

const GROUPS = [
  { name: "ICMC", years: ["2020", "2019", "2018"] },
  { name: "Putnam", years: ["2024", "2023"] },
];

const STORAGE_KEY = "competitor.sets.collapsed";

export default function SetsPanel({
  onSelectProblem,
  selectedProblemId,
  creationActive,
}: {
  onSelectProblem: (problemId?: string) => void;
  selectedProblemId?: string | null;
  creationActive?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    ICMC: true,
  });
  const [openYears, setOpenYears] = useState<Record<string, boolean>>({});
  const [library, setLibrary] = useState<LibraryState>({ problems: [], folders: [] });
  const [newFolder, setNewFolder] = useState(false);
  const [folderDraft, setFolderDraft] = useState("");

  useEffect(() => {
    const reload = () => setLibrary(loadLibrary(localStorage));
    reload();
    window.addEventListener("competitor:library-changed", reload);
    return () => window.removeEventListener("competitor:library-changed", reload);
  }, []);

  // creationActive collapses the rail without persisting: manual toggles
  // still own the stored preference, and any mode change re-evaluates.
  useEffect(() => {
    if (creationActive) {
      setCollapsed(true);
      return;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setCollapsed(stored === "1");
      } else {
        setCollapsed(window.innerWidth < 1280);
      }
    } catch {
      setCollapsed(window.innerWidth < 1280);
    }
  }, [creationActive]);

  function setPersisted(next: boolean) {
    setCollapsed(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      /* storage unavailable, panel still collapses for this session */
    }
  }

  function toggle(set: Record<string, boolean>, key: string) {
    return { ...set, [key]: !set[key] };
  }

  function commitRootFolder() {
    if (folderDraft.trim()) {
      const { state: next } = createFolder(library, folderDraft, null);
      setLibrary(next);
      saveLibrary(localStorage, next);
    }
    setFolderDraft("");
    setNewFolder(false);
  }

  function problemRow(group: string, year: string) {
    if (group === "ICMC" && year === "2020") {
      return (
        <button
          onClick={() => onSelectProblem()}
          className="block w-full px-2 py-1 text-left text-sm hover:underline"
        >
          Problem 1
        </button>
      );
    }
    return (
      <span className="block px-2 py-1 text-sm text-muted">Problem 1</span>
    );
  }

  const expanded = (
    <div className="max-h-screen w-64 overflow-y-auto border-r border-line p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <CreateMenu onNewFolder={() => setNewFolder(true)} />
        </div>
        <button onClick={() => setPersisted(true)} aria-label="Collapse panel">
          <RailMark label="LHS" />
        </button>
      </div>
      {newFolder && (
        <input
          autoFocus
          value={folderDraft}
          onChange={(e) => setFolderDraft(e.target.value)}
          onBlur={() => setNewFolder(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitRootFolder();
            if (e.key === "Escape") setNewFolder(false);
          }}
          placeholder="Folder name"
          aria-label="New folder name"
          className="mb-3 w-full rounded border border-line bg-background px-2 py-1 text-sm"
        />
      )}
      <div className="space-y-1">
        {GROUPS.map((g) => (
          <div key={g.name}>
            <button
              onClick={() => setOpenGroups((s) => toggle(s, g.name))}
              aria-expanded={!!openGroups[g.name]}
              className="flex w-full items-center justify-between px-2 py-1 text-left font-semibold hover:underline"
            >
              {g.name}
              <span aria-hidden="true">{openGroups[g.name] ? "−" : "+"}</span>
            </button>
            {openGroups[g.name] &&
              g.years.map((y) => (
                <div key={y} className="ml-3">
                  <button
                    onClick={() => setOpenYears((s) => toggle(s, `${g.name}/${y}`))}
                    aria-expanded={!!openYears[`${g.name}/${y}`]}
                    className="flex w-full items-center justify-between px-2 py-1 text-left text-sm hover:underline"
                  >
                    {y}
                    <span aria-hidden="true">
                      {openYears[`${g.name}/${y}`] ? "−" : "+"}
                    </span>
                  </button>
                  {openYears[`${g.name}/${y}`] && (
                    <div className="ml-3">{problemRow(g.name, y)}</div>
                  )}
                </div>
              ))}
          </div>
        ))}
        <ProblemLibrary
          state={library}
          selectedId={selectedProblemId ?? null}
          onChange={(next) => {
            setLibrary(next);
            saveLibrary(localStorage, next);
          }}
          onSelectProblem={(id) => onSelectProblem(id)}
        />
      </div>
      <button
        disabled
        title="coming soon"
        className="mt-4 w-full cursor-not-allowed rounded-[16px] bg-accent px-4 py-2 text-sm font-semibold text-white opacity-50"
      >
        New set
      </button>
    </div>
  );

  if (collapsed) {
    return (
      <div className="group relative flex min-h-screen w-12 flex-col items-center gap-4 pt-5">
        <button onClick={() => setPersisted(false)} aria-label="Expand panel">
          <RailMark label="LHS" />
        </button>
        <div className="invisible absolute bottom-0 left-full top-0 z-30 w-64 overflow-y-auto border-y border-l border-line bg-background opacity-0 transition-[opacity,transform] duration-200 motion-reduce:transition-none group-hover:visible group-hover:opacity-100 motion-safe:-translate-x-1 motion-safe:group-hover:translate-x-0">
          {expanded}
        </div>
      </div>
    );
  }

  return expanded;
}
