"use client";

import { useRef, useState } from "react";
import { filesToPages, type PageImage } from "@/lib/pages";

// Drop target + file input. Converts every drop (photos, HEIC, multi-page
// PDFs) into ordered JPEG pages via lib/pages.ts; the parent renders the
// resulting pages with PageThumbnails and owns reorder/remove.
export default function PhotoDropzone({
  pages,
  onPages,
  max,
  emptyLabel,
}: {
  pages: PageImage[];
  onPages: (pages: PageImage[]) => void;
  max: number;
  emptyLabel: React.ReactNode;
}) {
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  async function add(files: Iterable<File | undefined>) {
    if (busy) return;
    setNotes([]);
    setBusy("Reading…");
    try {
      const { pages: fresh, errors } = await filesToPages(files, setBusy);
      const kept = [...pages, ...fresh].slice(0, max);
      const dropped = pages.length + fresh.length - max;
      const allNotes = [...errors];
      if (dropped > 0) {
        allNotes.push(
          `Only the first ${max} pages are kept — remove pages that aren't part of this problem.`
        );
      }
      setNotes(allNotes);
      if (fresh.length > 0) onPages(kept);
    } finally {
      setBusy(null);
    }
  }

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
          void add(e.dataTransfer.files);
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
          void add(e.target.files ?? []);
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
