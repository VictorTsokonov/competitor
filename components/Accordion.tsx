"use client";

import { useState } from "react";

export type AccordionItem = { title: string; body: string };

export default function Accordion({ items }: { items: AccordionItem[] }) {
  const [open, setOpen] = useState(0);

  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={item.title} className="rounded-[16px] bg-surface p-5">
          <button
            onClick={() => setOpen(i)}
            aria-expanded={open === i}
            className="flex w-full items-center justify-between text-left font-semibold"
          >
            {item.title}
            <span aria-hidden="true">{open === i ? "−" : "+"}</span>
          </button>
          {open === i && <p className="mt-2 text-muted">{item.body}</p>}
        </div>
      ))}
    </div>
  );
}
