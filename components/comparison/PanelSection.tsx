"use client";

import { useState } from "react";

// The panel's title row, shared by the empty and the full comparison so
// the heading never jumps when the analysis lands.
export function ComparisonHeading() {
  return (
    <div className="flex min-h-[36px] items-center pr-[46px]">
      <span className="font-display text-[1.75rem] font-bold leading-none text-accent">
        Comparison
      </span>
    </div>
  );
}

// One collapsible section of the comparison panel.
export default function PanelSection({
  title,
  defaultOpen,
  first,
  children,
}: {
  title: string;
  defaultOpen: boolean;
  first?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={first ? "py-[14px]" : "border-t-2 border-dashed border-rule py-[14px]"}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-baseline justify-between text-left text-[1.25rem] font-bold"
      >
        {title}
        <span aria-hidden="true" className="text-muted">
          {open ? "–" : "+"}
        </span>
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}
