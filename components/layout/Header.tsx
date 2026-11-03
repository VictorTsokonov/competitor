"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

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
      </nav>
    </header>
  );
}
