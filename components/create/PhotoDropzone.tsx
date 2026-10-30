"use client";

import { useEffect, useRef, useState } from "react";

export type DroppedPhoto = { url: string; name: string };

export default function PhotoDropzone({
  photos,
  onPhotos,
  max,
  emptyLabel,
}: {
  photos: DroppedPhoto[];
  onPhotos: (photos: DroppedPhoto[]) => void;
  max: number;
  emptyLabel: React.ReactNode;
}) {
  const [dragging, setDragging] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const urls = useRef<string[]>([]);

  useEffect(() => {
    const seen = urls.current;
    return () => {
      for (const url of seen) URL.revokeObjectURL(url);
    };
  }, []);

  function add(files: Iterable<File | undefined>) {
    const fresh: DroppedPhoto[] = [];
    for (const file of files) {
      if (!file || !file.type.startsWith("image/")) continue;
      const url = URL.createObjectURL(file);
      urls.current.push(url);
      fresh.push({ url, name: file.name });
    }
    if (fresh.length === 0) return;
    const merged = [...photos, ...fresh].slice(0, max);
    setNote(
      photos.length + fresh.length > max
        ? `Only the first ${max} pages are kept.`
        : null
    );
    onPhotos(merged);
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
          add(e.dataTransfer.files);
        }}
        className={`w-full cursor-pointer rounded-[0.625rem] border-2 border-dashed bg-card/60 px-6 py-[26px] text-center text-[1.125rem] text-muted ${
          dragging ? "border-accent" : "border-ink/40"
        }`}
      >
        {photos.length === 0 ? (
          emptyLabel
        ) : (
          <span className="flex flex-wrap items-center justify-center gap-3">
            {photos.map((p) => (
              <img
                key={p.url}
                src={p.url}
                alt={p.name}
                className="h-24 w-auto rounded-md bg-card shadow-[2px_3px_0_rgba(43,38,34,0.12)]"
              />
            ))}
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={max > 1}
        aria-label="Choose photo files"
        className="sr-only"
        onChange={(e) => {
          add(e.target.files ?? []);
          e.target.value = "";
        }}
      />
      {note && (
        <p role="status" className="mt-2 text-center text-[0.9375rem] text-muted">
          {note}
        </p>
      )}
    </div>
  );
}
