import type { Metadata } from "next";
import Script from "next/script";
import "katex/dist/katex.min.css";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Competitor",
  description: "Stop solving. Start reading.",
};

const THEME_INIT = `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark")}}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-ink">
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT}
        </Script>
        <Nav />
        {children}
      </body>
    </html>
  );
}
