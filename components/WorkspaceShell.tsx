"use client";

import SetsPanel from "@/components/SetsPanel";
import PanelToggle from "@/components/PanelToggle";
import ResizeHandle from "@/components/ResizeHandle";
import { usePanelState } from "@/lib/usePanelState";

export default function WorkspaceShell({
  onSelectProblem,
  selectedProblemId,
  right,
  children,
}: {
  onSelectProblem: (problemId?: string) => void;
  selectedProblemId?: string | null;
  right: React.ReactNode;
  children: React.ReactNode;
}) {
  const {
    leftOpen,
    rightOpen,
    leftWidth,
    rightWidth,
    toggle,
    setWidth,
    resetWidth,
  } = usePanelState();

  return (
    <main className="relative min-h-screen bg-background text-ink">
      <PanelToggle
        side="left"
        open={leftOpen}
        onToggle={() => toggle("left")}
        label="sets"
      />
      <PanelToggle
        side="right"
        open={rightOpen}
        onToggle={() => toggle("right")}
        label="reference"
      />
      <div
        className="mx-auto grid max-w-[1440px]"
        style={{ gridTemplateColumns: "auto minmax(0, 1fr) auto" }}
      >
        <aside
          className="relative top-0 h-screen overflow-hidden transition-[width] duration-200 ease"
          style={{ width: leftOpen ? leftWidth : 0 }}
        >
          <div className="h-full overflow-y-auto" style={{ width: leftWidth }}>
            <SetsPanel
              onSelectProblem={onSelectProblem}
              selectedProblemId={selectedProblemId}
            />
          </div>
          {leftOpen && (
            <ResizeHandle
              side="left"
              width={leftWidth}
              onWidth={(w) => setWidth("left", w)}
              onReset={() => resetWidth("left")}
            />
          )}
        </aside>

        <div className="min-w-0 px-6 py-10">{children}</div>

        <aside
          className="relative top-0 h-screen overflow-hidden transition-[width] duration-200 ease"
          style={{ width: rightOpen ? rightWidth : 0 }}
        >
          <div className="h-full overflow-y-auto" style={{ width: rightWidth }}>
            {right}
          </div>
          {rightOpen && (
            <ResizeHandle
              side="right"
              width={rightWidth}
              onWidth={(w) => setWidth("right", w)}
              onReset={() => resetWidth("right")}
            />
          )}
        </aside>
      </div>
    </main>
  );
}
