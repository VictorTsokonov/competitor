"use client";

import { useRouter } from "next/navigation";
import CreateProblemForm from "@/components/CreateProblemForm";
import LatexCheatsheet from "@/components/LatexCheatsheet";
import AppShell from "@/components/layout/AppShell";
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
    <AppShell
      onSelectProblem={selectFromLibrary}
      rightLabel="LaTeX reference"
      centre={
        <div className="mx-auto w-full max-w-[48rem]">
          <h1 className="text-3xl font-bold tracking-tight">New problem</h1>
          <CreateProblemForm onSaved={() => router.push("/dashboard")} />
        </div>
      }
      right={<LatexCheatsheet />}
    />
  );
}
