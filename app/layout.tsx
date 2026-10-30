import type { Metadata } from "next";
import { Caveat, Kalam } from "next/font/google";
import "katex/dist/katex.min.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Competitor",
  description: "Stop solving. Start reading.",
};

const display = Caveat({
  weight: ["600", "700"],
  subsets: ["latin"],
  variable: "--font-display",
});

const body = Kalam({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-body",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} bg-paper font-body text-ink`}>
        {children}
      </body>
    </html>
  );
}
