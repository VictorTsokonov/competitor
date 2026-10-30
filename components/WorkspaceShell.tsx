"use client";

import { useEffect, useState } from "react";
import SetsPanel from "@/components/SetsPanel";
import RailMark from "@/components/RailMark";

const RAIL_KEY = "competitor.rail.collapsed";

export default function WorkspaceShell({
  onSelectProblem,
  selectedProblemId,
  creationActive,
  right,
  children,
}: {
  onSelectProblem: (problemId?: string) => void;
  selectedProblemId?: string | null;
  creationActive?: boolean;
  right: React.ReactNode;
  children: React.ReactNode;
}) {
  const [railCollapsed, setRailCollapsed] = useState(false);

  useEffect(() => {
    try {
      setRailCollapsed(localStorage.getItem(RAIL_KEY) === "1");
    } catch {
      /* storage unavailable: rail stays expanded */
    }
  }, []);

  function setRailPersisted(next: boolean) {
    setRailCollapsed(next);
    try {
      localStorage.setItem(RAIL_KEY, next ? "1" : "0");
    } catch {
      /* storage unavailable: rail still toggles for this session */
    }
  }

  return (
    <main className="min-h-screen bg-background text-ink">
      <div className="mx-auto flex max-w-[1440px] items-start">
        <div className="sticky top-0 max-h-screen shrink-0">
          <SetsPanel
            onSelectProblem={onSelectProblem}
            selectedProblemId={selectedProblemId}
            creationActive={creationActive}
          />
        </div>

        <div className="min-w-0 flex-1 px-6 py-10">{children}</div>

        {railCollapsed ? (
          <div className="group relative sticky top-0 flex max-h-screen min-h-screen w-12 shrink-0 flex-col items-center gap-4 pb-4 pt-5">
            <button onClick={() => setRailPersisted(false)} aria-label="Expand panel">
              <RailMark label="RHS" />
            </button>
            <div className="invisible absolute bottom-0 right-full top-0 z-30 w-80 overflow-y-auto border border-line bg-background opacity-0 transition-[opacity,transform] duration-200 motion-reduce:transition-none group-hover:visible group-hover:opacity-100 motion-safe:translate-x-1 motion-safe:group-hover:translate-x-0">
              {right}
            </div>
          </div>
        ) : (
          <div className="sticky top-0 max-h-screen shrink-0 overflow-y-auto border-l border-line">
            <div className="flex items-center justify-end px-5 pt-5">
              <button onClick={() => setRailPersisted(true)} aria-label="Collapse panel">
                <RailMark label="RHS" />
              </button>
            </div>
            {right}
          </div>
        )}
      </div>
    </main>
  );
}
