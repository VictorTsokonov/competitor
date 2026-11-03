"use client";

import { useEffect, useRef, useState } from "react";
import type { PageImage } from "@/lib/pages";
import { pastedPageFiles } from "@/components/create/pastedFiles";
import { usePageDrop, type PageDrop } from "@/components/create/usePageDrop";

// Drop target + file input. Converts every drop (photos, HEIC, multi-page
// PDFs) into ordered JPEG pages via ./usePageDrop.ts; the parent renders the
// resulting pages with PageThumbnails and owns reorder/remove. With
// acceptPaste, a pasted screenshot or PDF anywhere on the page is taken as a
// drop here — only one dropzone on a page should accept pastes. A parent
// that routes pastes itself (the creation form) passes its own drop.
export default function PhotoDropzone({
  pages,
  onPages,
  max,
  emptyLabel,
  acceptPaste = false,
  drop,
}: {
  pages: PageImage[];
  onPages: (pages: PageImage[]) => void;
  max: number;
  emptyLabel: React.ReactNode;
  acceptPaste?: boolean;
  drop?: PageDrop;
}) {
  const [dragging, setDragging] = useState(false);
  const own = usePageDrop(pages, onPages, max);
  const { busy, notes, add } = drop ?? own;
  const inputRef = useRef<HTMLInputElement>(null);
  // The paste listener calls the latest add(), so it sees the current pages.
  const addRef = useRef(add);
  useEffect(() => {
    addRef.current = add;
  });

  useEffect(() => {
    if (!acceptPaste) return;
    function onPaste(e: ClipboardEvent) {
      const files = pastedPageFiles(e);
      if (files.length === 0) return;
      e.preventDefault();
      void addRef.current(files);
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [acceptPaste]);

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void add(Array.from(e.dataTransfer.files));
        }}
        className={`w-full cursor-pointer rounded-[0.625rem] border-2 border-dashed bg-card/60 px-6 py-[26px] text-center text-[1.125rem] text-muted ${
          dragging ? "border-accent" : "border-ink/40"
        }`}
      >
        {busy ? (
          busy
        ) : pages.length === 0 ? (
          emptyLabel
        ) : (
          <>
            {pages.length} page{pages.length === 1 ? "" : "s"} ready — drop
            more, or <span className="underline">choose files</span>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif,application/pdf,.pdf"
        multiple={max > 1}
        aria-label="Choose photo or PDF files"
        className="sr-only"
        onChange={(e) => {
          // Copy first: clearing the input empties its live FileList, which
          // would cut the async read off after the first file.
          void add(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
      {notes.map((note) => (
        <p
          key={note}
          role="status"
          className="mt-2 text-center text-[0.9375rem] text-muted"
        >
          {note}
        </p>
      ))}
    </div>
  );
}
