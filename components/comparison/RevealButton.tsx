"use client";

import { useState } from "react";
import Pill from "@/components/ui/Pill";

export default function RevealButton() {
  const [shown, setShown] = useState(false);
  return (
    <div className="mt-[22px] grid gap-[10px]">
      <Pill variant="primary" onClick={() => setShown((v) => !v)} className="w-full">
        Reveal solution
      </Pill>
      <p className="text-center text-[0.9375rem] text-muted">
        The expert reading is a plausible narrative, not a trace of the
        model&apos;s thinking.
      </p>
      {shown && (
        <p role="status" className="text-center text-[0.9375rem] text-muted">
          Full solution reveal coming soon.
        </p>
      )}
    </div>
  );
}
