"use client";

import { useState } from "react";
import Link from "next/link";

export default function CreateMenu({ onNewFolder }: { onNewFolder: () => void }) {
  const [open, setOpen] = useState(false);

  function newFolder() {
    setOpen(false);
    onNewFolder();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Create problem or folder"
        title="Create problem or folder"
        className="flex w-full items-center justify-center rounded-[16px] border border-line py-1.5 text-lg font-semibold"
      >
        <span aria-hidden="true">+</span>
      </button>
      {open && (
        <>
          <button
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div
            role="menu"
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
            }}
            className="absolute inset-x-0 top-full z-20 rounded-[16px] border border-line bg-background py-1"
          >
            <Link
              href="/createProblem"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-left text-sm hover:underline"
            >
              Problem
            </Link>
            <button
              role="menuitem"
              onClick={newFolder}
              className="block w-full px-4 py-2 text-left text-sm hover:underline"
            >
              Folder
            </button>
          </div>
        </>
      )}
    </div>
  );
}
