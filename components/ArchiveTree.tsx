"use client";

import { useState } from "react";
import { FileIcon, FolderIcon } from "@/components/TreeIcons";
import { RowChevron } from "@/components/TreeRow";

const GROUPS = [
  { name: "ICMC", years: ["2020", "2019", "2018"] },
  { name: "Putnam", years: ["2024", "2023"] },
];

export default function ArchiveTree({
  onSelectProblem,
}: {
  onSelectProblem: () => void;
}) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ ICMC: true });
  const [openYears, setOpenYears] = useState<Record<string, boolean>>({});

  function toggle(set: Record<string, boolean>, key: string) {
    return { ...set, [key]: !set[key] };
  }

  return (
    <div>
      {GROUPS.map((g) => (
        <div key={g.name}>
          <button
            onClick={() => setOpenGroups((s) => toggle(s, g.name))}
            aria-expanded={!!openGroups[g.name]}
            className="flex h-8 w-full items-center gap-1 rounded-lg pr-1 text-left text-[13.5px] font-semibold hover:bg-surface"
          >
            <RowChevron open={!!openGroups[g.name]} />
            <span aria-hidden="true" className="text-muted">
              <FolderIcon />
            </span>
            <span className="min-w-0 flex-1 truncate" title={g.name}>
              {g.name}
            </span>
          </button>
          {openGroups[g.name] &&
            g.years.map((y) => (
              <div key={y} style={{ paddingLeft: 16 }}>
                <button
                  onClick={() => setOpenYears((s) => toggle(s, `${g.name}/${y}`))}
                  aria-expanded={!!openYears[`${g.name}/${y}`]}
                  className="flex h-8 w-full items-center gap-1 rounded-lg pr-1 text-left text-[13.5px] hover:bg-surface"
                >
                  <RowChevron open={!!openYears[`${g.name}/${y}`]} />
                  <span className="min-w-0 flex-1 truncate" title={y}>
                    {y}
                  </span>
                </button>
                {openYears[`${g.name}/${y}`] && (
                  <div style={{ paddingLeft: 16 }}>
                    {g.name === "ICMC" && y === "2020" ? (
                      <button
                        onClick={() => onSelectProblem()}
                        className="flex h-8 w-full items-center gap-1 rounded-lg pr-1 text-left text-[13.5px] hover:bg-surface"
                      >
                        <span className="w-4 shrink-0" />
                        <span aria-hidden="true" className="text-muted">
                          <FileIcon />
                        </span>
                        <span className="min-w-0 flex-1 truncate" title="Problem 1">
                          Problem 1
                        </span>
                      </button>
                    ) : (
                      <span className="flex h-8 w-full items-center gap-1 rounded-lg pr-1 text-left text-[13.5px] text-muted">
                        <span className="w-4 shrink-0" />
                        <span aria-hidden="true">
                          <FileIcon />
                        </span>
                        <span className="min-w-0 flex-1 truncate" title="Problem 1">
                          Problem 1
                        </span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}
