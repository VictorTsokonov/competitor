"use client";

import ResizeHandle from "@/components/ResizeHandle";

export default function Panel({
  side,
  open,
  width,
  onWidth,
  onReset,
  children,
}: {
  side: "left" | "right";
  open: boolean;
  width: number;
  onWidth: (px: number) => void;
  onReset: () => void;
  children: React.ReactNode;
}) {
  return (
    <aside
      className="relative h-full overflow-hidden transition-[width] duration-200 ease"
      style={{ width: open ? width : 0 }}
    >
      <div className="h-full overflow-y-auto" style={{ width }}>
        {children}
      </div>
      {open && (
        <ResizeHandle side={side} width={width} onWidth={onWidth} onReset={onReset} />
      )}
    </aside>
  );
}
