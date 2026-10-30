"use client";

import { useEffect, useRef, useState } from "react";

export default function ResizeHandle({
  side,
  width,
  onWidth,
  onReset,
}: {
  side: "left" | "right";
  width: number;
  onWidth: (px: number) => void;
  onReset: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; w: number } | null>(null);

  useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      document.body.style.userSelect = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onMove(e: PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    onWidth(d.w + (side === "left" ? dx : -dx));
  }

  function onUp() {
    drag.current = null;
    setDragging(false);
    document.body.style.userSelect = "";
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
  }

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize panel"
      title="Drag to resize, double-click to reset"
      onPointerDown={(e) => {
        e.preventDefault();
        drag.current = { x: e.clientX, w: width };
        e.currentTarget.setPointerCapture(e.pointerId);
        document.body.style.userSelect = "none";
        setDragging(true);
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
      }}
      onDoubleClick={onReset}
      className={`group absolute bottom-0 top-0 z-10 w-[6px] cursor-col-resize ${
        side === "left" ? "-right-[3px]" : "-left-[3px]"
      }`}
    >
      <div
        className={`mx-auto h-full ${
          dragging
            ? "w-[2px] bg-accent"
            : "w-[2px] bg-rule group-hover:bg-accent"
        }`}
      />
    </div>
  );
}
