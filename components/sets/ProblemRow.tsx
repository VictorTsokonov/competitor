"use client";

import type { StoredProblem } from "@/lib/problems";
import { deleteProblem, renameProblem } from "@/lib/problems";
import { discardJob, useJobs } from "@/lib/jobStore";
import { isRunning } from "@/lib/jobTypes";
import { useAppMode } from "@/lib/useAppMode";
import { PencilIcon, TrashIcon } from "@/components/TreeIcons";
import { ActionButton, RenameInput, rowClass, rowIndent } from "@/components/sets/TreeRow";
import type { TreeCallbacks } from "@/components/sets/TreeRow";

// The C∅ loader's empty set, small and turning, after a problem whose
// pipeline job is running.
function RunningMark({ title }: { title: string }) {
  return (
    <span title={title} className="shrink-0 font-display text-[1.125rem] font-bold leading-none text-accent">
      <span aria-hidden="true" className="inline-block animate-[spin_2.6s_linear_infinite]">
        ∅
      </span>
      <span className="sr-only">{title}</span>
    </span>
  );
}

// Renames and deletes are announced so the dashboard picks them up (the
// Sets panel saves the library without the event); a deleted problem's
// job stops too, and anything still in flight for it lands nowhere.
export default function ProblemRow({
  problem,
  depth,
  cb,
}: {
  problem: StoredProblem;
  depth: number;
  cb: TreeCallbacks;
}) {
  const { local } = useAppMode();
  const job = useJobs()[problem.id];
  const running = !!job && isRunning(job);
  const editing = cb.editing?.kind === "problem" && cb.editing.id === problem.id;
  const creating = problem.state === "creating";

  function changed() {
    window.dispatchEvent(new Event("competitor:library-changed"));
  }

  return (
    <div
      draggable={!editing && !cb.readOnly}
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
      style={{ paddingLeft: rowIndent(depth) }}
      className={`${rowClass({ selected: cb.selectedId === problem.id })} cursor-pointer`}
    >
      <span className="w-4 shrink-0" />
      {editing ? (
        <RenameInput
          initial={problem.name}
          onCommit={(n) => {
            cb.onChange(renameProblem(cb.state, problem.id, n));
            cb.setEditing(null);
            changed();
          }}
          onCancel={() => cb.setEditing(null)}
        />
      ) : (
        <>
          <span className="flex min-w-0 flex-1 items-center gap-[6px]">
            <span className={`min-w-0 truncate ${creating ? "italic text-muted" : ""}`}>
              {problem.name}
              {creating && " …"}
            </span>
            {running && (
              <RunningMark
                title={
                  job.stages.transcribe.phase === "running"
                    ? "Reading the screenshot…"
                    : "Analysing…"
                }
              />
            )}
          </span>
          {!cb.readOnly && (
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
                onClick={() => {
                  cb.onChange(deleteProblem(cb.state, problem.id));
                  discardJob(local, problem.id);
                  changed();
                }}
              >
                <TrashIcon />
              </ActionButton>
            </span>
          )}
        </>
      )}
    </div>
  );
}
