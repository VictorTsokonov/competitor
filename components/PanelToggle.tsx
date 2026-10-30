"use client";

import IconButton from "@/components/ui/IconButton";

function PanelGlyph({ mirror }: { mirror: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      style={{ width: "1rem", height: "1rem" }}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d={mirror ? "M15 4v16" : "M9 4v16"} />
    </svg>
  );
}

export default function PanelToggle({
  side,
  open,
  onToggle,
  label,
  className,
}: {
  side: "left" | "right";
  open: boolean;
  onToggle: () => void;
  label: string;
  className?: string;
}) {
  const text = `${open ? "Hide" : "Show"} ${label}`;
  return (
    <div
      className={`absolute top-[14px] z-[2] ${
        side === "left" ? "left-[14px]" : "right-[14px]"
      }${className ? ` ${className}` : ""}`}
    >
      <IconButton label={text} onClick={onToggle}>
        <PanelGlyph mirror={side === "right"} />
      </IconButton>
    </div>
  );
}
