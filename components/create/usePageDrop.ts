"use client";

import { useEffect, useRef, useState } from "react";
import { filesToPages, type PageImage } from "@/lib/pages";

// What one page field does with files it is given, by drop, file picker or
// paste: converts them into ordered JPEG pages via lib/pages.ts, reports
// progress ("Reading… page 3 of 6"), errors and the page limit, and adds
// them to the field. A field owns one; the creation form owns its two so
// it can route pastes to either with the same progress and notes as a drop.
export type PageDrop = {
  busy: string | null;
  notes: string[];
  // Resolves to how many new pages joined the field.
  add: (files: Iterable<File | undefined>) => Promise<number>;
};

export function usePageDrop(
  pages: PageImage[],
  onPages: (pages: PageImage[]) => void,
  max: number
): PageDrop {
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  // A ref as well as state, so two quick pastes cannot both start.
  const busyRef = useRef(false);
  // A conversion that finishes after its field is gone (another problem
  // was opened meanwhile) is dropped, never added to whatever is shown now.
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  async function add(files: Iterable<File | undefined>): Promise<number> {
    if (busyRef.current) {
      setNotes(["Still reading the last files — add these again in a moment."]);
      return 0;
    }
    busyRef.current = true;
    setNotes([]);
    setBusy("Reading…");
    try {
      const { pages: fresh, errors } = await filesToPages(files, (note) => {
        if (mounted.current) setBusy(note);
      });
      if (!mounted.current) return 0;
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
      return Math.max(0, kept.length - pages.length);
    } finally {
      busyRef.current = false;
      if (mounted.current) setBusy(null);
    }
  }

  return { busy, notes, add };
}
