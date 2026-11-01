"use client";

import PhotoDropzone from "@/components/create/PhotoDropzone";
import PageThumbnails from "@/components/comparison/PageThumbnails";
import { MAX_ATTEMPT_PAGES, type PageImage } from "@/lib/pages";

const STEPS = [
  "Assume you will get it wrong. Mark the phrases and write what each suggests.",
  "Say what it is about, define the objects, list two or three methods with the phrase that triggered each.",
  "Attempt it. Then photograph the pages — or drop a PDF export of them — here.",
];

const NUMERALS = ["(i)", "(ii)", "(iii)"];

export default function AttemptSection({
  pages,
  onPages,
}: {
  pages: PageImage[];
  onPages: (pages: PageImage[]) => void;
}) {
  function remove(id: string) {
    onPages(pages.filter((p) => p.id !== id));
  }

  function move(id: string, dir: -1 | 1) {
    const from = pages.findIndex((p) => p.id === id);
    const to = from + dir;
    if (from < 0 || to < 0 || to >= pages.length) return;
    const next = [...pages];
    [next[from], next[to]] = [next[to], next[from]];
    onPages(next);
  }

  return (
    <div className="relative mb-[30px] rounded-[0.625rem] border-2 border-dashed border-ink/40 p-6">
      <div
        aria-hidden="true"
        className="absolute left-7 top-[-14px] h-[26px] w-[110px] rotate-[-3deg] bg-[#d6c496]/70"
      />
      <div className="mb-3 font-display text-[1.875rem] font-bold leading-none text-accent">
        Your attempt{" "}
        <span className="font-body text-[1rem] font-normal text-muted">
          · add now, or after you have tried it on paper
        </span>
      </div>
      <div className="grid gap-[10px] text-[1.125rem]">
        {STEPS.map((step, i) => (
          <div key={i} className="flex items-start gap-[10px]">
            <span className="w-10 flex-none font-display text-[1.875rem] font-bold leading-none text-accent">
              {NUMERALS[i]}
            </span>
            <span>{step}</span>
          </div>
        ))}
      </div>
      <div className="mt-[18px]">
        <PhotoDropzone
          pages={pages}
          onPages={onPages}
          max={MAX_ATTEMPT_PAGES}
          emptyLabel={
            <>
              Drop photos or a PDF here, or{" "}
              <span className="underline">choose files</span> · up to{" "}
              {MAX_ATTEMPT_PAGES} pages
            </>
          }
        />
        {pages.length > 0 && (
          <PageThumbnails pages={pages} onRemove={remove} onMove={move} />
        )}
        <p className="mt-2 text-center text-[0.9375rem] text-muted">
          {pages.length > 0
            ? "Keep only this problem's pages, in reading order — remove the rest."
            : "Pages are sent only when you submit your attempt."}
        </p>
      </div>
    </div>
  );
}
