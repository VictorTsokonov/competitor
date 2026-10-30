"use client";

import { useRouter } from "next/navigation";
import CreateProblemForm from "@/components/CreateProblemForm";
import LatexCheatsheet from "@/components/LatexCheatsheet";
import WorkspaceShell from "@/components/WorkspaceShell";
import { SELECT_INTENT_KEY } from "@/lib/problems";

export default function CreateProblem() {
  const router = useRouter();

  function selectFromLibrary(problemId?: string) {
    if (problemId) {
      try {
        sessionStorage.setItem(SELECT_INTENT_KEY, problemId);
      } catch {
        /* private mode: fall through to plain navigation */
      }
    }
    router.push("/dashboard");
  }

  return (
    <WorkspaceShell
      onSelectProblem={selectFromLibrary}
      right={<LatexCheatsheet />}
    >
      <div className="mx-auto w-full max-w-[760px]">
        <h1 className="text-3xl font-bold tracking-tight">New problem</h1>
        <CreateProblemForm onSaved={() => router.push("/dashboard")} />
      </div>
    </WorkspaceShell>
  );
}
