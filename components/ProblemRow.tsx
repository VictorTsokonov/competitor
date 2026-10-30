"use client";

import type { StoredProblem } from "@/lib/problems";
import { deleteProblem, renameProblem } from "@/lib/problems";
import { FileIcon, PencilIcon, TrashIcon } from "@/components/TreeIcons";
import { ActionButton, RenameInput, rowClass } from "@/components/TreeRow";
import type { TreeCallbacks } from "@/components/TreeRow";

export default function ProblemRow({
  problem,
  depth,
  cb,
}: {
  problem: StoredProblem;
  depth: number;
  cb: TreeCallbacks;
}) {
  const editing = cb.editing?.kind === "problem" && cb.editing.id === problem.id;
  return (
    <div
      draggable={!editing}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/problem-id", problem.id);
        cb.setDragPayload({ kind: "problem", id: problem.id });
      }}
      onDragEnd={() => {
        cb.setDragPayload(null);
        cb.setDropTarget(null);
      }}
      onClick={() => cb.onSelectProblem(problem.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") cb.onSelectProblem(problem.id);
      }}
      title={problem.name}
      style={{ paddingLeft: depth * 16 }}
      className={`${rowClass(cb.selectedId === problem.id)} cursor-pointer`}
    >
      <span className="w-4 shrink-0" />
      <span aria-hidden="true" className="text-muted">
        <FileIcon />
      </span>
      {editing ? (
        <RenameInput
          initial={problem.name}
          onCommit={(n) => {
            cb.onChange(renameProblem(cb.state, problem.id, n));
            cb.setEditing(null);
          }}
          onCancel={() => cb.setEditing(null)}
        />
      ) : (
        <>
          <span className="min-w-0 flex-1 truncate">{problem.name}</span>
          <span className="hidden shrink-0 items-center group-hover:flex group-focus-within:flex">
            <ActionButton
              label={`Rename ${problem.name}`}
              title="Rename"
              onClick={() => cb.setEditing({ kind: "problem", id: problem.id })}
            >
              <PencilIcon />
            </ActionButton>
            <ActionButton
              label={`Delete ${problem.name}`}
              title="Delete"
              onClick={() => cb.onChange(deleteProblem(cb.state, problem.id))}
            >
              <TrashIcon />
            </ActionButton>
          </span>
        </>
      )}
    </div>
  );
}
