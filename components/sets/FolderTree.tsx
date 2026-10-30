"use client";

import FolderNode from "@/components/sets/FolderNode";
import type { TreeCallbacks } from "@/components/sets/TreeRow";

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
