"use client";

import { useState } from "react";
import { STAGE_SOURCES } from "@/lib/stage-sources";

export default function ResponseCard({
  label,
  title,
  divider = true,
  sourceKey,
  children,
}: {
  label: string;
  title: string;
  divider?: boolean;
  sourceKey?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const source = sourceKey ? STAGE_SOURCES[sourceKey] : undefined;

  return (
    <section className={divider ? "mt-12 border-t border-line pt-12" : "mt-12"}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full text-left"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">
          {label}
        </p>
        <h3 className="mt-1 flex items-center justify-between text-xl font-semibold">
          {title}
          <span aria-hidden="true">{open ? "−" : "+"}</span>
        </h3>
      </button>
      {source && (
        <p className="mt-1 text-xs text-muted">
          Source:{" "}
          {source.url ? (
            <a
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              {source.cite}
            </a>
          ) : (
            source.cite
          )}{" "}
          — {source.note}
        </p>
      )}
      {open && <div className="mt-4 space-y-4">{children}</div>}
    </section>
  );
}
