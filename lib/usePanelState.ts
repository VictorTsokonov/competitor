"use client";

import { useCallback, useEffect, useState } from "react";

export type PanelSide = "left" | "right";

export type PanelState = {
  leftOpen: boolean;
  rightOpen: boolean;
  leftWidth: number;
  rightWidth: number;
};

// v2: defaults re-anchored to design/dashboard.html (17rem / 21.25rem);
// the key bump discards widths persisted under the old defaults.
const STORAGE_KEY = "competitor.panels.v2";

export const PANEL_MIN = 220;
export const PANEL_MAX = 420;
export const DEFAULT_LEFT_WIDTH = 272;
export const DEFAULT_RIGHT_WIDTH = 340;

function clampWidth(px: number): number {
  if (!Number.isFinite(px)) return DEFAULT_LEFT_WIDTH;
  return Math.min(PANEL_MAX, Math.max(PANEL_MIN, Math.round(px)));
}

function viewportDefaults(): PanelState {
  const w = typeof window === "undefined" ? 1440 : window.innerWidth;
  return {
    leftOpen: w >= 1024,
    rightOpen: w >= 1280,
    leftWidth: DEFAULT_LEFT_WIDTH,
    rightWidth: DEFAULT_RIGHT_WIDTH,
  };
}

function load(): PanelState {
  const fallback = viewportDefaults();
  try {
    if (typeof window === "undefined") return fallback;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const p = JSON.parse(raw) as Partial<PanelState>;
    return {
      leftOpen: typeof p.leftOpen === "boolean" ? p.leftOpen : fallback.leftOpen,
      rightOpen: typeof p.rightOpen === "boolean" ? p.rightOpen : fallback.rightOpen,
      leftWidth: typeof p.leftWidth === "number" ? clampWidth(p.leftWidth) : fallback.leftWidth,
      rightWidth: typeof p.rightWidth === "number" ? clampWidth(p.rightWidth) : fallback.rightWidth,
    };
  } catch {
    return fallback;
  }
}

export function usePanelState() {
  const [state, setState] = useState<PanelState>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable: panels still work for this session */
    }
  }, [state]);

  const toggle = useCallback((side: PanelSide) => {
    setState((s) =>
      side === "left" ? { ...s, leftOpen: !s.leftOpen } : { ...s, rightOpen: !s.rightOpen }
    );
  }, []);

  // Cmd/Ctrl+B toggles left, +Shift toggles right. Ignored in editable text.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) {
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggle(e.shiftKey ? "right" : "left");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  const setWidth = useCallback((side: PanelSide, px: number) => {
    const w = clampWidth(px);
    setState((s) => (side === "left" ? { ...s, leftWidth: w } : { ...s, rightWidth: w }));
  }, []);

  const resetWidth = useCallback((side: PanelSide) => {
    setState((s) =>
      side === "left"
        ? { ...s, leftWidth: DEFAULT_LEFT_WIDTH }
        : { ...s, rightWidth: DEFAULT_RIGHT_WIDTH }
    );
  }, []);

  return { ...state, toggle, setWidth, resetWidth };
}
