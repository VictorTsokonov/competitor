"use client";

import { useEffect, useState } from "react";
import ArchiveTree from "@/components/ArchiveTree";
import ProblemLibrary from "@/components/ProblemLibrary";
import { PlusIcon } from "@/components/TreeIcons";
import {
  createFolder,
  loadLibrary,
  saveLibrary,
  type LibraryState,
} from "@/lib/problems";

export default function SetsPanel({
  onSelectProblem,
  selectedProblemId,
}: {
  onSelectProblem: (problemId?: string) => void;
  selectedProblemId?: string | null;
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
    <div className="px-2 pb-4 pt-3">
      <div className="flex h-8 items-center gap-1 pl-[44px] pr-1">
        <h2 className="min-w-0 flex-1 text-[13px] font-semibold uppercase text-muted">
          Sets
        </h2>
        <button
          onClick={() => setNewFolder(true)}
          title="New set"
          aria-label="New set"
          className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-ink"
        >
          <PlusIcon />
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
          className="mb-2 w-full rounded border border-line bg-background px-2 py-1 text-sm"
        />
      )}
      <ArchiveTree onSelectProblem={onSelectProblem} />
      <ProblemLibrary
        state={library}
        selectedId={selectedProblemId ?? null}
        onChange={update}
        onSelectProblem={(id) => onSelectProblem(id)}
      />
    </div>
  );
}
