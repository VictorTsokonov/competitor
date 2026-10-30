"use client";

import { useRouter } from "next/navigation";
import CreateProblemForm from "@/components/create/CreateProblemForm";
import LatexReference from "@/components/latex/LatexReference";
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
          <CreateProblemForm onSaved={selectFromLibrary} />
        </div>
      }
      right={<LatexReference />}
    />
  );
}
