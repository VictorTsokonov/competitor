"use client";

import { useState } from "react";
import type { LibraryState } from "@/lib/problems";
import { moveProblem, moveFolder } from "@/lib/problems";
import ProblemRow from "@/components/sets/ProblemRow";
import { FolderTree } from "@/components/sets/FolderTree";
import type { DragPayload, TreeCallbacks } from "@/components/sets/TreeRow";

export default function ProblemLibrary({
  state,
  selectedId,
  onChange,
  onSelectProblem,
}: {
  state: LibraryState;
  selectedId: string | null;
  onChange: (next: LibraryState) => void;
  onSelectProblem: (problemId: string) => void;
}) {
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [dragPayload, setDragPayload] = useState<DragPayload>(null);
  const [editing, setEditing] = useState<TreeCallbacks["editing"]>(null);

  const cb: TreeCallbacks = {
    state,
    selectedId,
    editing,
    setEditing,
    dropTarget,
    setDropTarget,
    dragPayload,
    setDragPayload,
    onChange,
    onSelectProblem,
  };

  const ungrouped = state.problems.filter((p) => p.folderId === null);
  const rootActive = dropTarget === "root";

  return (
    <div>
      <FolderTree cb={cb} />
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDropTarget("root");
        }}
        onDragLeave={() => setDropTarget((t) => (t === "root" ? null : t))}
        onDrop={(e) => {
          e.preventDefault();
          const problemId = e.dataTransfer.getData("text/problem-id");
          const folderId = e.dataTransfer.getData("text/folder-id");
          if (problemId) onChange(moveProblem(state, problemId, null));
          else if (folderId) onChange(moveFolder(state, folderId, null));
          setDropTarget(null);
          setDragPayload(null);
        }}
        className={`py-1 ${rootActive ? "rounded-lg bg-ink/10" : ""}`}
      >
        <hr className="border-rule" />
        <div className="mt-1">
          {ungrouped.map((p) => (
            <ProblemRow key={p.id} problem={p} depth={0} cb={cb} />
          ))}
        </div>
      </div>
    </div>
  );
}
