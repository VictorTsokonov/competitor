"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Pill from "@/components/ui/Pill";

export default function Header() {
  const pathname = usePathname();
  const [toast, setToast] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function signIn() {
    setToast(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(false), 2500);
  }

  function navClass(href: string): string {
    const active = href === "/" ? pathname === href : pathname.startsWith(href);
    return active
      ? "border-b-[3px] border-ink text-ink no-underline"
      : "text-ink no-underline";
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-dashed border-rule px-8 py-[1.125rem]">
      <Link
        href="/"
        className="font-display text-[2.125rem] font-bold leading-none text-ink no-underline"
      >
        C<span className="text-accent">∅</span>
      </Link>
      <nav aria-label="Main" className="flex flex-wrap items-center gap-6 text-[1.1875rem]">
        <Link href="/dashboard" className={navClass("/dashboard")}>
          Dashboard
        </Link>
        <Link href="/guide" className={navClass("/guide")}>
          Guide
        </Link>
        <Pill
          onClick={signIn}
          className="min-h-[2.625rem] gap-2.5 px-[1.375rem] text-[1.0625rem]"
        >
          <span aria-hidden="true">G</span> Continue with Google
        </Pill>
      </nav>
      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-card px-5 py-2 text-[1rem] font-bold shadow-[2px_3px_0_rgba(43,38,34,0.12)]"
        >
          Sign-in coming soon
        </div>
      )}
    </header>
  );
}
