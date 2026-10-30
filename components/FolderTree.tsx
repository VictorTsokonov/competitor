"use client";

import { useState } from "react";
import type { LibraryState, ProblemFolder } from "@/lib/problems";
import {
  createFolder,
  deleteFolder,
  descendants,
  moveFolder,
  moveProblem,
  renameFolder,
  renameProblem,
  type StoredProblem,
} from "@/lib/problems";

export type DragPayload = { kind: "problem" | "folder"; id: string } | null;

// One shared geometry for guides and rows: rule i sits at ruleAt(i),
// row content at padFor(depth). Both derive from GUIDE, so they cannot drift.
export const GUIDE = { base: 8, step: 22, cap: 4 };

export function padFor(depth: number): number {
  return GUIDE.base + 8 + Math.min(depth, GUIDE.cap) * GUIDE.step;
}

export function ruleAt(i: number): number {
  return GUIDE.base + i * GUIDE.step;
}

export function RenameInput({
  initial,
  onCommit,
  onCancel,
}: {
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
      aria-label="Rename"
      className="w-full rounded border border-line bg-background px-1 py-0.5 text-sm"
    />
  );
}

export function FolderIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className="shrink-0">
      <path d="M1.5 4.5c0-.8.7-1.5 1.5-1.5h3l1.5 2h6c.8 0 1.5.7 1.5 1.5v5c0 .8-.7 1.5-1.5 1.5H3c-.8 0-1.5-.7-1.5-1.5v-7z" />
    </svg>
  );
}

export function FileIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className="shrink-0">
      <path d="M4 1.5h5.5L13 5v9.5H4z" />
      <path d="M9.5 1.5V5H13" />
    </svg>
  );
}

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
// grandchild bubbles through every ancestor folder and the last writer
// wins, landing the item a level up (or higher).
function dropOnto(cb: TreeCallbacks, folderId: string | null, e: React.DragEvent) {
  e.preventDefault();
  e.stopPropagation();
  const problemId = e.dataTransfer.getData("text/problem-id");
  const draggedFolder = e.dataTransfer.getData("text/folder-id");
  if (problemId) cb.onChange(moveProblem(cb.state, problemId, folderId));
  else if (draggedFolder) cb.onChange(moveFolder(cb.state, draggedFolder, folderId));
  cb.setDropTarget(null);
  cb.setDragPayload(null);
}

export function ProblemRow({
  problem,
  depth,
  cb,
}: {
  problem: StoredProblem;
  depth: number;
  cb: TreeCallbacks;
}) {
  const editingThis = cb.editing?.kind === "problem" && cb.editing.id === problem.id;
  return (
    <div className="flex items-center gap-1" style={{ paddingLeft: padFor(depth) }}>
      <button
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData("text/problem-id", problem.id);
          cb.setDragPayload({ kind: "problem", id: problem.id });
        }}
        onDragEnd={() => {
          cb.setDragPayload(null);
          cb.setDropTarget(null);
        }}
        onClick={() => cb.onSelectProblem(problem.id)}
        title="Drag into a folder, or click to open"
        className={`block min-w-0 flex-1 truncate px-2 py-1 text-left text-sm hover:underline ${
          cb.selectedId === problem.id ? "font-semibold" : ""
        }`}
      >
        <span aria-hidden="true" className="mr-1 text-muted"><FileIcon /></span>
        {editingThis ? (
          <RenameInput
            initial={problem.name}
            onCommit={(n) => {
              cb.onChange(renameProblem(cb.state, problem.id, n));
              cb.setEditing(null);
            }}
            onCancel={() => cb.setEditing(null)}
          />
        ) : (
          problem.name
        )}
      </button>
      {!editingThis && (
        <button
          onClick={() => cb.setEditing({ kind: "problem", id: problem.id })}
          aria-label={`Rename ${problem.name}`}
          className="shrink-0 px-1 text-xs text-muted hover:underline"
        >
          ✎
        </button>
      )}
    </div>
  );
}

function FolderNode({ folder, depth, cb }: { folder: ProblemFolder; depth: number; cb: TreeCallbacks }) {
  const [open, setOpen] = useState(true);
  const [newChild, setNewChild] = useState(false);
  const [childDraft, setChildDraft] = useState("");
  const editingThis = cb.editing?.kind === "folder" && cb.editing.id === folder.id;
  const illegal =
    cb.dragPayload?.kind === "folder" &&
    (cb.dragPayload.id === folder.id ||
      descendants(cb.state, cb.dragPayload.id).includes(folder.id));
  const active = cb.dropTarget === folder.id && !illegal;
  const kids = cb.state.folders.filter((f) => f.parentId === folder.id);
  const problems = cb.state.problems.filter((p) => p.folderId === folder.id);

  return (
    <div
      onDragOver={(e) => {
        if (illegal) return;
        e.preventDefault();
        e.stopPropagation();
        cb.setDropTarget(folder.id);
      }}
      onDragLeave={() => cb.setDropTarget((t) => (t === folder.id ? null : t))}
      onDrop={(e) => dropOnto(cb, folder.id, e)}
      className={`rounded-[16px] py-0.5 ${active ? "bg-surface" : ""} ${
        illegal ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-center gap-1" style={{ paddingLeft: padFor(depth) }}>
        <button
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("text/folder-id", folder.id);
            cb.setDragPayload({ kind: "folder", id: folder.id });
          }}
          onDragEnd={() => {
            cb.setDragPayload(null);
            cb.setDropTarget(null);
          }}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          title="Drag to move folder, or click to collapse"
          className="flex min-w-0 flex-1 items-center gap-1 px-1 py-1 text-left text-sm font-semibold"
        >
          <span aria-hidden="true" className="text-muted">{open ? "−" : "+"}</span>
          <span aria-hidden="true" className="text-muted"><FolderIcon /></span>
          {editingThis ? (
            <RenameInput
              initial={folder.name}
              onCommit={(n) => {
                cb.onChange(renameFolder(cb.state, folder.id, n));
                cb.setEditing(null);
              }}
              onCancel={() => cb.setEditing(null)}
            />
          ) : (
            <span className="truncate">
              {folder.name}{" "}
              <span className="font-normal text-muted">
                ({kids.length + problems.length})
              </span>
            </span>
          )}
        </button>
        {!editingThis && (
          <>
            <button
              onClick={() => setNewChild(true)}
              aria-label={`New subfolder in ${folder.name}`}
              title="New subfolder"
              className="shrink-0 px-1 text-xs text-muted hover:underline"
            >
              +
            </button>
            <button
              onClick={() => cb.setEditing({ kind: "folder", id: folder.id })}
              aria-label={`Rename ${folder.name}`}
              className="shrink-0 px-1 text-xs text-muted hover:underline"
            >
              ✎
            </button>
            <button
              onClick={() => cb.onChange(deleteFolder(cb.state, folder.id))}
              aria-label={`Delete ${folder.name}`}
              title="Delete folder (contents move up one level)"
              className="shrink-0 px-1 text-xs text-muted hover:underline"
            >
              ×
            </button>
          </>
        )}
      </div>
      {open && (
        <div>
          {kids.map((k) => (
            <FolderNode key={k.id} folder={k} depth={depth + 1} cb={cb} />
          ))}
          {problems.map((p) => (
            <ProblemRow key={p.id} problem={p} depth={depth + 1} cb={cb} />
          ))}
          {newChild ? (
            <div style={{ paddingLeft: padFor(depth + 1) }}>
              <input
                autoFocus
                value={childDraft}
                onChange={(e) => setChildDraft(e.target.value)}
                onBlur={() => setNewChild(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (childDraft.trim()) {
                      const { state: next } = createFolder(cb.state, childDraft, folder.id);
                      cb.onChange(next);
                    }
                    setChildDraft("");
                    setNewChild(false);
                  }
                  if (e.key === "Escape") setNewChild(false);
                }}
                placeholder="Subfolder name"
                aria-label="New subfolder name"
                className="mt-1 w-full rounded border border-line bg-background px-2 py-1 text-sm"
              />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export function FolderTree({ cb }: { cb: TreeCallbacks }) {
  const roots = cb.state.folders.filter((f) => f.parentId === null);
  return (
    <>
      {roots.map((f) => (
        <FolderNode key={f.id} folder={f} depth={0} cb={cb} />
      ))}
    </>
  );
}
