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

/** Left-edge indent per tree depth, from design/dashboard.html rows. */
export function rowIndent(depth: number): number {
  if (depth <= 0) return 8;
  if (depth === 1) return 26;
  return 58 + (depth - 2) * 16;
}

export function rowClass(opts: { selected?: boolean; bold?: boolean }): string {
  const base =
    "group flex min-h-[34px] w-full items-center gap-2 rounded-md py-1 pr-2 text-left text-[1.125rem] hover:bg-ink/[0.06] max-[60rem]:min-h-[2.75rem]";
  const sel = opts.selected ? " bg-accent/10 shadow-[inset_3px_0_0_0_var(--accent)]" : "";
  const bold = opts.bold ? " font-bold" : "";
  return `${base}${sel}${bold}`;
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
      className="w-full rounded border border-rule bg-card px-1 py-0.5 text-[1.125rem]"
    />
  );
}

export function RowChevron({ open }: { open: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block w-[14px] shrink-0 text-center transition-transform ${
        open ? "rotate-90" : ""
      }`}
    >
      ▸
    </span>
  );
}

export function RowLabel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <span className="min-w-0 flex-1 truncate" title={title}>
      {children}
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
      className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-ink/10 hover:text-ink"
    >
      {children}
    </button>
  );
}
