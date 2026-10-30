"use client";

import { useEffect, useState } from "react";
import ArchiveTree from "@/components/sets/ArchiveTree";
import ProblemLibrary from "@/components/sets/ProblemLibrary";
import IconButton from "@/components/ui/IconButton";
import {
  createFolder,
  loadLibrary,
  saveLibrary,
  type LibraryState,
} from "@/lib/problems";

export default function SetsPanel({
  onSelectProblem,
  selectedProblemId,
  footer,
}: {
  onSelectProblem: (problemId?: string) => void;
  selectedProblemId?: string | null;
  footer?: React.ReactNode;
}) {
  const [library, setLibrary] = useState<LibraryState>({ problems: [], folders: [] });
  const [newFolder, setNewFolder] = useState(false);
  const [folderDraft, setFolderDraft] = useState("");

  useEffect(() => {
    const reload = () => setLibrary(loadLibrary(localStorage));
    reload();
    window.addEventListener("competitor:library-changed", reload);
    return () => window.removeEventListener("competitor:library-changed", reload);
  }, []);

  function commitRootFolder() {
    if (folderDraft.trim()) {
      const { state: next } = createFolder(library, folderDraft, null);
      setLibrary(next);
      saveLibrary(localStorage, next);
    }
    setFolderDraft("");
    setNewFolder(false);
  }

  function update(next: LibraryState) {
    setLibrary(next);
    saveLibrary(localStorage, next);
  }

  return (
    <div className="flex h-full flex-col gap-[2px] overflow-y-auto px-[0.875rem] pb-7 pt-[0.875rem]">
      <div className="flex min-h-[2.25rem] items-center justify-between pl-[46px]">
        <span className="font-display text-[1.75rem] font-bold leading-none text-accent">
          Sets
        </span>
        <IconButton size="sm" label="New set" onClick={() => setNewFolder(true)}>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            style={{ width: "0.875rem", height: "0.875rem" }}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </IconButton>
      </div>
      <div className="h-[10px]" />
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
          className="mb-2 w-full rounded border border-rule bg-card px-2 py-1 text-[1rem]"
        />
      )}
      <ArchiveTree onSelectProblem={onSelectProblem} />
      <ProblemLibrary
        state={library}
        selectedId={selectedProblemId ?? null}
        onChange={update}
        onSelectProblem={(id) => onSelectProblem(id)}
      />
      {footer && (
        <>
          <div className="min-h-4 flex-1" />
          {footer}
        </>
      )}
    </div>
  );
}
