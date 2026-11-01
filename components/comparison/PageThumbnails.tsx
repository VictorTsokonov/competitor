"use client";

import type { PageImage } from "@/lib/pages";

const TILTS = ["rotate-[-2deg]", "rotate-[1.5deg]", "rotate-[-1deg]", "rotate-[2deg]"];

// Ordered strip of attempt pages, notebook-photo style. With onRemove /
// onMove it is the pre-submit editor (remove pages that belong to another
// problem, fix the order); without them it is a read-only record. With no
// pages at all it keeps the original decorative placeholder.
export default function PageThumbnails({
  pages,
  onRemove,
  onMove,
}: {
  pages?: PageImage[];
  onRemove?: (id: string) => void;
  onMove?: (id: string, dir: -1 | 1) => void;
}) {
  if (!pages || pages.length === 0) {
    return (
      <div aria-hidden="true" className="mt-[10px] flex gap-[10px]">
        <div className="h-[76px] w-[58px] rotate-[-2deg] bg-card shadow-[2px_3px_0_rgba(43,38,34,0.12)]" />
        <div className="h-[76px] w-[58px] rotate-[1.5deg] bg-card shadow-[2px_3px_0_rgba(43,38,34,0.12)]" />
      </div>
    );
  }
  return (
    <ul className="mt-[10px] flex list-none flex-wrap gap-x-[14px] gap-y-3 p-0">
      {pages.map((page, i) => (
        <li key={page.id} className="flex flex-col items-center gap-1">
          <div className={`relative ${TILTS[i % TILTS.length]}`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- local data URL, next/image cannot optimise it */}
            <img
              src={page.dataUrl}
              alt={`Page ${i + 1} · ${page.label}`}
              className="h-[104px] w-auto rounded-[3px] bg-card p-[3px] shadow-[2px_3px_0_rgba(43,38,34,0.12)]"
            />
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(page.id)}
                aria-label={`Remove page ${i + 1}`}
                title="Remove this page"
                className="absolute right-[-8px] top-[-8px] inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border-2 border-ink bg-paper font-display text-[0.9375rem] leading-none text-ink hover:bg-ink/10"
              >
                ×
              </button>
            )}
          </div>
          <span className="flex items-center gap-1 font-display text-[1.0625rem] font-bold text-muted">
            {onMove && i > 0 && (
              <button
                type="button"
                onClick={() => onMove(page.id, -1)}
                aria-label={`Move page ${i + 1} earlier`}
                className="cursor-pointer px-1 hover:text-ink"
              >
                ‹
              </button>
            )}
            p{i + 1}
            {onMove && i < pages.length - 1 && (
              <button
                type="button"
                onClick={() => onMove(page.id, 1)}
                aria-label={`Move page ${i + 1} later`}
                className="cursor-pointer px-1 hover:text-ink"
              >
                ›
              </button>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
