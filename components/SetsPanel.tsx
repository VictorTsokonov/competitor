"use client";

import { useEffect, useState } from "react";

const GROUPS = [
  { name: "ICMC", years: ["2020", "2019", "2018"] },
  { name: "Putnam", years: ["2024", "2023"] },
];

const STORAGE_KEY = "competitor.sets.collapsed";

export default function SetsPanel({
  onSelectProblem,
}: {
  onSelectProblem: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    ICMC: true,
  });
  const [openYears, setOpenYears] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setCollapsed(stored === "1");
      } else {
        setCollapsed(window.innerWidth < 1280);
      }
    } catch {
      setCollapsed(window.innerWidth < 1280);
    }
  }, []);

  function setPersisted(next: boolean) {
    setCollapsed(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      /* storage unavailable, panel still collapses for this session */
    }
  }

  function toggle(set: Record<string, boolean>, key: string) {
    return { ...set, [key]: !set[key] };
  }

  if (collapsed) {
    return (
      <div className="flex w-12 flex-col items-center gap-4 py-4">
        <button
          onClick={() => setPersisted(false)}
          aria-label="Expand sets panel"
          className="text-lg"
        >
          ›
        </button>
        <span className="text-xs font-semibold uppercase tracking-widest text-muted [writing-mode:vertical-rl]">
          Sets
        </span>
      </div>
    );
  }

  function problemRow(group: string, year: string) {
    if (group === "ICMC" && year === "2020") {
      return (
        <button
          onClick={onSelectProblem}
          className="block w-full px-2 py-1 text-left text-sm hover:underline"
        >
          Problem 1
        </button>
      );
    }
    return (
      <span className="block px-2 py-1 text-sm text-muted">Problem 1</span>
    );
  }

  return (
    <div className="w-64 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Sets</h2>
        <button onClick={() => setPersisted(true)} aria-label="Collapse sets panel" className="text-lg">
          ‹
        </button>
      </div>
      <div className="space-y-1">
        {GROUPS.map((g) => (
          <div key={g.name}>
            <button
              onClick={() => setOpenGroups((s) => toggle(s, g.name))}
              aria-expanded={!!openGroups[g.name]}
              className="flex w-full items-center justify-between px-2 py-1 text-left font-semibold hover:underline"
            >
              {g.name}
              <span aria-hidden="true">{openGroups[g.name] ? "−" : "+"}</span>
            </button>
            {openGroups[g.name] &&
              g.years.map((y) => (
                <div key={y} className="ml-3">
                  <button
                    onClick={() => setOpenYears((s) => toggle(s, `${g.name}/${y}`))}
                    aria-expanded={!!openYears[`${g.name}/${y}`]}
                    className="flex w-full items-center justify-between px-2 py-1 text-left text-sm hover:underline"
                  >
                    {y}
                    <span aria-hidden="true">
                      {openYears[`${g.name}/${y}`] ? "−" : "+"}
                    </span>
                  </button>
                  {openYears[`${g.name}/${y}`] && (
                    <div className="ml-3">{problemRow(g.name, y)}</div>
                  )}
                </div>
              ))}
          </div>
        ))}
        <div>
          <button
            onClick={() => setOpenGroups((s) => toggle(s, "My sets"))}
            aria-expanded={!!openGroups["My sets"]}
            className="flex w-full items-center justify-between px-2 py-1 text-left font-semibold hover:underline"
          >
            My sets
            <span aria-hidden="true">{openGroups["My sets"] ? "−" : "+"}</span>
          </button>
          {openGroups["My sets"] && (
            <span className="ml-3 block px-2 py-1 text-sm text-muted">
              Assessment project 1
            </span>
          )}
        </div>
      </div>
      <button
        disabled
        title="coming soon"
        className="mt-4 w-full cursor-not-allowed rounded-[16px] bg-accent px-4 py-2 text-sm font-semibold text-white opacity-50"
      >
        New set
      </button>
    </div>
  );
}
