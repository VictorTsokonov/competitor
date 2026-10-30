"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Panel from "@/components/layout/Panel";
import Drawer from "@/components/layout/Drawer";
import SetsPanel from "@/components/sets/SetsPanel";
import PanelToggle from "@/components/PanelToggle";
import Pill from "@/components/ui/Pill";
import IconButton from "@/components/ui/IconButton";
import { usePanelState } from "@/lib/usePanelState";

function useIsPhone(): boolean {
  const [isPhone, setIsPhone] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 60rem)");
    function sync() {
      setIsPhone(query.matches);
    }
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  return isPhone;
}

function PhoneGlyph({ mirror }: { mirror: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      style={{ width: "1.125rem", height: "1.125rem" }}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d={mirror ? "M15 4v16" : "M9 4v16"} />
    </svg>
  );
}

export default function AppShell({
  onSelectProblem,
  selectedProblemId,
  centre,
  right,
  rightLabel,
  leftFooter,
}: {
  onSelectProblem: (problemId?: string) => void;
  selectedProblemId?: string | null;
  centre: React.ReactNode;
  right: React.ReactNode;
  rightLabel: string;
  leftFooter?: React.ReactNode;
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
  const isPhone = useIsPhone();
  const [drawer, setDrawer] = useState<"left" | "right" | null>(null);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    if (!isPhone) setDrawer(null);
  }, [isPhone]);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <div className="max-[60rem]:hidden">
        <Header />
      </div>
      <div className="hidden items-center justify-between border-b-2 border-dashed border-rule px-4 py-3 max-[60rem]:flex">
        <IconButton
          size="lg"
          label="Show sets"
          onClick={() => setDrawer("left")}
        >
          <PhoneGlyph mirror={false} />
        </IconButton>
        <Link
          href="/"
          className="font-display text-[2rem] font-bold leading-none text-ink no-underline"
        >
          C<span className="text-accent">∅</span>
        </Link>
        <IconButton
          size="lg"
          label={`Show ${rightLabel}`}
          onClick={() => setDrawer("right")}
        >
          <PhoneGlyph mirror={true} />
        </IconButton>
      </div>

      <div className="relative min-h-0 flex-1">
        <div
          className="mx-auto grid h-full max-w-[1440px]"
          style={{ gridTemplateColumns: "auto minmax(0, 1fr) auto" }}
        >
          <Panel
            side="left"
            open={leftOpen && !isPhone}
            width={leftWidth}
            onWidth={(w) => setWidth("left", w)}
            onReset={() => resetWidth("left")}
          >
            <SetsPanel
              onSelectProblem={onSelectProblem}
              selectedProblemId={selectedProblemId}
              footer={leftFooter}
            />
          </Panel>

          <main className="min-h-0 min-w-0 overflow-y-auto px-10 pb-[5.5rem] pt-14 max-[60rem]:px-[1.125rem] max-[60rem]:pb-8 max-[60rem]:pt-5">
            {centre}
          </main>

          <Panel
            side="right"
            open={rightOpen && !isPhone}
            width={rightWidth}
            onWidth={(w) => setWidth("right", w)}
            onReset={() => resetWidth("right")}
          >
            {right}
          </Panel>
        </div>

        <div className="max-[60rem]:hidden">
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
            label={rightLabel}
          />
        </div>

        {isPhone && drawer === "left" && (
          <Drawer side="left" label="Sets" onClose={() => setDrawer(null)}>
            <div className="absolute left-[14px] top-[14px] z-[2]">
              <IconButton label="Hide sets" onClick={() => setDrawer(null)}>
                <PhoneGlyph mirror={false} />
              </IconButton>
            </div>
            <SetsPanel
              onSelectProblem={(id) => {
                onSelectProblem(id);
                setDrawer(null);
              }}
              selectedProblemId={selectedProblemId}
              footer={leftFooter}
            />
            <nav
              aria-label="Main"
              className="flex flex-wrap items-center gap-6 px-8 pb-8 pt-4 text-[1.1875rem]"
            >
              <Link href="/dashboard" className="text-ink no-underline">
                Dashboard
              </Link>
              <Link href="/guide" className="text-ink no-underline">
                Guide
              </Link>
              <Pill
                onClick={() => {
                  setToast(true);
                  setTimeout(() => setToast(false), 2500);
                }}
                className="min-h-[2.625rem] gap-2.5 px-[1.375rem] text-[1.0625rem]"
              >
                <span aria-hidden="true">G</span> Continue with Google
              </Pill>
            </nav>
            {toast && (
              <div
                role="status"
                className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-card px-5 py-2 text-[1rem] font-bold shadow-[2px_3px_0_rgba(43,38,34,0.12)]"
              >
                Sign-in coming soon
              </div>
            )}
          </Drawer>
        )}
        {isPhone && drawer === "right" && (
          <Drawer
            side="right"
            label={rightLabel}
            onClose={() => setDrawer(null)}
          >
            <div className="absolute right-[14px] top-[14px] z-[2]">
              <IconButton
                label={`Hide ${rightLabel}`}
                onClick={() => setDrawer(null)}
              >
                <PhoneGlyph mirror={true} />
              </IconButton>
            </div>
            {right}
          </Drawer>
        )}
      </div>
    </div>
  );
}
