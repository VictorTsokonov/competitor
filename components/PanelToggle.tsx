"use client";

function PanelGlyph({ mirror }: { mirror: boolean }) {
  // Rounded rectangle, vertical divider at one third (mirrored per side).
  const x = mirror ? 10.5 : 5.5;
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <rect x="1.5" y="2.5" width="13" height="11" rx="2" />
      <line x1={x} y1="2.5" x2={x} y2="13.5" />
    </svg>
  );
}

export default function PanelToggle({
  side,
  open,
  onToggle,
  label,
}: {
  side: "left" | "right";
  open: boolean;
  onToggle: () => void;
  label: string;
}) {
  const text = `${open ? "Hide" : "Show"} ${label}`;
  return (
    <button
      onClick={onToggle}
      aria-label={text}
      title={text}
      className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-ink ${
        side === "left" ? "absolute left-3 top-3 z-30" : "absolute right-3 top-3 z-30"
      }`}
    >
      <PanelGlyph mirror={side === "right"} />
    </button>
  );
}
