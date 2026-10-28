"use client";

import { useEffect, useRef } from "react";

const GLYPHS = "∑∫∂∀∃∈⊆≤≥≠∞πλεδ∇⇒{}[]+−×=01237nk";
const COUNT = 500;
const TURN_MS = 60000;

type Pt = { x: number; y: number; z: number; g: string };

function fibonacciSphere(): Pt[] {
  const pts: Pt[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < COUNT; i++) {
    const y = 1 - (i / (COUNT - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const t = i * golden;
    pts.push({ x: Math.cos(t) * r, y, z: Math.sin(t) * r, g: GLYPHS[(i * 7) % GLYPHS.length] });
  }
  return pts;
}

export default function GlyphSphere() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pts = fibonacciSphere();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function size() {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    }
    size();
    window.addEventListener("resize", size);

    function draw(angle: number) {
      if (!canvas || !ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      const scale = w / Math.max(1, canvas.getBoundingClientRect().width || 1);
      const dark = document.documentElement.classList.contains("dark");
      const ink = dark ? "255,255,255" : "28,30,33";
      const R = Math.min(w, h) * 0.36;
      const cx = w / 2;
      const cy = h / 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      ctx.clearRect(0, 0, w, h);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const p of pts) {
        const x = p.x * cos + p.z * sin;
        const z = -p.x * sin + p.z * cos;
        const depth = (z + 1) / 2;
        const alpha = 0.05 + depth * 0.22;
        const pxSize = (11 + depth * 3) * scale;
        ctx.font = `${pxSize}px ui-monospace, monospace`;
        ctx.fillStyle = `rgba(${ink},${alpha.toFixed(3)})`;
        ctx.fillText(p.g, cx + x * R, cy - p.y * R);
      }
    }

    let raf = 0;
    if (reduced) {
      draw(0.6);
    } else {
      const start = performance.now();
      // rAF stops firing while the tab is hidden, so this pauses for free.
      const loop = (now: number) => {
        draw(((now - start) / TURN_MS) * Math.PI * 2);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", size);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
