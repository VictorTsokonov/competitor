"use client";

import { useState } from "react";
import type { ProblemFolder } from "@/lib/problems";
import {
  createFolder,
  deleteFolder,
  descendants,
  renameFolder,
} from "@/lib/problems";
import ProblemRow from "@/components/sets/ProblemRow";
import {
  ActionButton,
  RenameInput,
  RowChevron,
  dropOnto,
  rowClass,
  rowIndent,
  type TreeCallbacks,
} from "@/components/sets/TreeRow";
import {
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "@/components/TreeIcons";

export default function FolderNode({ folder, depth, cb }: {
  folder: ProblemFolder;
  depth: number;
  cb: TreeCallbacks;
}) {
  const [open, setOpen] = useState(true);
  const [newChild, setNewChild] = useState(false);
  const [childDraft, setChildDraft] = useState("");
  const editing = cb.editing?.kind === "folder" && cb.editing.id === folder.id;
  const illegal =
    cb.dragPayload?.kind === "folder" &&
    (cb.dragPayload.id === folder.id ||
      descendants(cb.state, cb.dragPayload.id).includes(folder.id));
  const active = cb.dropTarget === folder.id && !illegal;
  const kids = cb.state.folders.filter((f) => f.parentId === folder.id);
  const problems = cb.state.problems.filter((p) => p.folderId === folder.id);

  function commitChild() {
    if (childDraft.trim()) {
      const { state: next } = createFolder(cb.state, childDraft, folder.id);
      cb.onChange(next);
    }
    setChildDraft("");
    setNewChild(false);
  }

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
      className={illegal ? "opacity-50" : ""}
    >
      <div
        draggable={!editing}
        onDragStart={(e) => {
          e.dataTransfer.setData("text/folder-id", folder.id);
          cb.setDragPayload({ kind: "folder", id: folder.id });
        }}
        onDragEnd={() => {
          cb.setDragPayload(null);
          cb.setDropTarget(null);
        }}
        onClick={() => setOpen((v) => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter") setOpen((v) => !v);
        }}
        aria-expanded={open}
        title={folder.name}
        style={{ paddingLeft: rowIndent(depth) }}
        className={`${rowClass({ bold: true })} cursor-pointer ${active ? "bg-ink/10" : ""}`}
      >
        <RowChevron open={open} />
        {editing ? (
          <RenameInput
            initial={folder.name}
            onCommit={(n) => {
              cb.onChange(renameFolder(cb.state, folder.id, n));
              cb.setEditing(null);
            }}
            onCancel={() => cb.setEditing(null)}
          />
        ) : (
          <>
            <span className="min-w-0 flex-1 truncate font-semibold">{folder.name}</span>
            <span className="hidden shrink-0 items-center group-hover:flex group-focus-within:flex">
              <ActionButton label={`Add subfolder to ${folder.name}`} title="Add subfolder" onClick={() => { setNewChild(true); setOpen(true); }}>
                <PlusIcon />
              </ActionButton>
              <ActionButton label={`Rename ${folder.name}`} title="Rename" onClick={() => cb.setEditing({ kind: "folder", id: folder.id })}>
                <PencilIcon />
              </ActionButton>
              <ActionButton label={`Delete ${folder.name}`} title="Delete" onClick={() => cb.onChange(deleteFolder(cb.state, folder.id))}>
                <TrashIcon />
              </ActionButton>
            </span>
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
          {newChild && (
            <div style={{ paddingLeft: (depth + 1) * 16 }}>
              <input
                autoFocus
                value={childDraft}
                onChange={(e) => setChildDraft(e.target.value)}
                onBlur={() => setNewChild(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitChild();
                  if (e.key === "Escape") setNewChild(false);
                }}
                placeholder="Subfolder name"
                aria-label="New subfolder name"
                className="mt-1 w-full rounded border border-rule bg-card px-2 py-1 text-[1rem]"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
