"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export default function Nav() {
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

  return (
    <header className="border-b border-line bg-background">
      <nav className="relative mx-auto flex max-w-7xl items-center justify-between p-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          Competitor
        </Link>
        <div className="absolute left-1/2 flex -translate-x-1/2 gap-6 text-[15px]">
          <Link href="/dashboard" className="hover:underline">
            Dashboard
          </Link>
          <Link href="/guide" className="hover:underline">
            Guide
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={signIn}
            className="flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm font-semibold"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <text x="8" y="12.5" textAnchor="middle" fontSize="12" fontWeight="bold" fill="currentColor" fontFamily="sans-serif">
                G
              </text>
            </svg>
            Continue with Google
          </button>
        </div>
      </nav>
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-surface px-5 py-2 text-sm font-semibold shadow-lg">
          Sign-in coming soon
        </div>
      )}
    </header>
  );
}
