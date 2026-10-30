"use client";

import { useState } from "react";
import type { LibraryState } from "@/lib/problems";
import { moveFolder, moveProblem } from "@/lib/problems";

export type DragPayload = { kind: "problem" | "folder"; id: string } | null;

export type TreeCallbacks = {
  state: LibraryState;
  selectedId: string | null;
  editing: { kind: "folder" | "problem"; id: string } | null;
  setEditing: React.Dispatch<
    React.SetStateAction<{ kind: "folder" | "problem"; id: string } | null>
  >;
  dropTarget: string | null;
  setDropTarget: React.Dispatch<React.SetStateAction<string | null>>;
  dragPayload: DragPayload;
  setDragPayload: React.Dispatch<React.SetStateAction<DragPayload>>;
  onChange: (next: LibraryState) => void;
  onSelectProblem: (problemId: string) => void;
};

// stopPropagation is the nested-drop fix: without it, a drop on a
// grandchild bubbles through every ancestor and the last writer wins.
export function dropOnto(cb: TreeCallbacks, folderId: string | null, e: React.DragEvent) {
  e.preventDefault();
  e.stopPropagation();
  const problemId = e.dataTransfer.getData("text/problem-id");
  const draggedFolder = e.dataTransfer.getData("text/folder-id");
  if (problemId) cb.onChange(moveProblem(cb.state, problemId, folderId));
  else if (draggedFolder) cb.onChange(moveFolder(cb.state, draggedFolder, folderId));
  cb.setDropTarget(null);
  cb.setDragPayload(null);
}

export function rowClass(selected: boolean): string {
  return `group flex h-8 w-full items-center gap-1 rounded-lg border-l-2 pr-1 text-left text-[13.5px] hover:bg-surface ${
    selected ? "border-accent bg-surface" : "border-transparent"
  }`;
}

export function RenameInput({ initial, onCommit, onCancel }: {
  initial: string;
  onCommit: (name: string) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  return (
    <input
      autoFocus
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => onCommit(draft)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onCommit(draft);
        if (e.key === "Escape") onCancel();
      }}
      onClick={(e) => e.stopPropagation()}
      aria-label="Rename"
      className="w-full rounded border border-line bg-background px-1 py-0.5 text-[13.5px]"
    />
  );
}

export function RowChevron({ open }: { open: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex w-4 shrink-0 items-center justify-center text-muted transition-transform duration-200 ${
        open ? "rotate-90" : ""
      }`}
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M6 4l4 4-4 4" />
      </svg>
    </span>
  );
}

export function ActionButton({ label, title, onClick, children }: {
  label: string;
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={label}
      title={title}
      className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-ink"
    >
      {children}
    </button>
  );
}
