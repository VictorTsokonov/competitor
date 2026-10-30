"use client";

import { useState } from "react";
import { rowClass, rowIndent, RowChevron, RowLabel } from "@/components/sets/TreeRow";

const GROUPS = [
  { name: "ICMC", years: ["2020", "2019", "2018"] },
  { name: "Putnam", years: ["2024", "2023"] },
];

function ArchiveRow({
  depth,
  chevron,
  bold,
  muted,
  onClick,
  expanded,
  title,
  children,
}: {
  depth: number;
  chevron?: boolean;
  bold?: boolean;
  muted?: boolean;
  onClick?: () => void;
  expanded?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  const cls = `${rowClass({ bold })}${muted ? " text-muted" : ""}${onClick ? " cursor-pointer" : ""}`;
  const style = { paddingLeft: rowIndent(depth) };
  const inner = (
    <>
      {chevron ? <RowChevron open={!!expanded} /> : <span className="w-[14px] shrink-0" />}
      <RowLabel title={title}>{children}</RowLabel>
    </>
  );
  if (!onClick) {
    return (
      <span className={cls} style={style}>
        {inner}
      </span>
    );
  }
  return (
    <button onClick={onClick} aria-expanded={expanded} style={style} className={cls}>
      {inner}
    </button>
  );
}

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
          <ArchiveRow
            depth={0}
            chevron
            bold
            title={g.name}
            expanded={!!openGroups[g.name]}
            onClick={() => setOpenGroups((s) => toggle(s, g.name))}
          >
            {g.name}
          </ArchiveRow>
          {openGroups[g.name] &&
            g.years.map((y) => (
              <div key={y}>
                <ArchiveRow
                  depth={1}
                  chevron
                  title={y}
                  expanded={!!openYears[`${g.name}/${y}`]}
                  onClick={() => setOpenYears((s) => toggle(s, `${g.name}/${y}`))}
                >
                  {y}
                </ArchiveRow>
                {openYears[`${g.name}/${y}`] &&
                  (g.name === "ICMC" && y === "2020" ? (
                    <ArchiveRow depth={2} title="Problem 1" onClick={onSelectProblem}>
                      Problem 1
                    </ArchiveRow>
                  ) : (
                    <ArchiveRow depth={2} title="Problem 1" muted>
                      Problem 1
                    </ArchiveRow>
                  ))}
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}
