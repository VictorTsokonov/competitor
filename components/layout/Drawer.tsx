"use client";

import { useEffect } from "react";
import Backdrop from "@/components/ui/Backdrop";

export default function Drawer({
  side,
  label,
  onClose,
  children,
}: {
  side: "left" | "right";
  label: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <>
      <Backdrop onClose={onClose} />
      <aside
        aria-label={label}
        className={`absolute bottom-0 top-0 z-50 overflow-y-auto bg-paper ${
          side === "left"
            ? "left-0 w-[84%] max-w-[20rem] shadow-[4px_0_0_rgba(43,38,34,0.15)]"
            : "right-0 w-[88%] max-w-[21rem] shadow-[-4px_0_0_rgba(43,38,34,0.15)]"
        }`}
      >
        {children}
      </aside>
    </>
  );
}
