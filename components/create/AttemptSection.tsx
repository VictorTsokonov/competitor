"use client";

import { useState } from "react";
import PhotoDropzone, { type DroppedPhoto } from "@/components/create/PhotoDropzone";

const STEPS = [
  "Assume you will get it wrong. Mark the phrases and write what each suggests.",
  "Say what it is about, define the objects, list two or three methods with the phrase that triggered each.",
  "Attempt it. Then photograph the pages, one page per photo, and drop them here.",
];

const NUMERALS = ["(i)", "(ii)", "(iii)"];

export default function AttemptSection() {
  const [photos, setPhotos] = useState<DroppedPhoto[]>([]);
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
          photos={photos}
          onPhotos={setPhotos}
          max={6}
          emptyLabel={
            <>
              Drop photos here, or{" "}
              <span className="underline">choose files</span> · up to 6 pages
            </>
          }
        />
        <p className="mt-2 text-center text-[0.9375rem] text-muted">
          Photos stay on this page for now.
        </p>
      </div>
    </div>
  );
}
