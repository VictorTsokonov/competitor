"use client";

import { createContext, useContext, useMemo } from "react";
import type { AppMode } from "./mode";
import type { ExampleSummary } from "./demoExamples";
import {
  exampleLibrary,
  loadLibrary,
  type KeyValueStorage,
  type LibraryState,
} from "./problems";

// The server's mode decision (app/dashboard/page.tsx), handed to the
// client components that need it. Each mode keeps its browser state under
// its own prefix, so the demo's examples and a live library never mix.

export type ModeStorage = KeyValueStorage & { removeItem(key: string): void };

function namespaced(mode: AppMode, pick: () => Storage): ModeStorage {
  const prefix = `competitor.${mode}.`;
  return {
    getItem: (key) => pick().getItem(prefix + key),
    setItem: (key, value) => pick().setItem(prefix + key, value),
    removeItem: (key) => pick().removeItem(prefix + key),
  };
}

export type AppModeValue = {
  mode: AppMode;
  examples: ExampleSummary[];
  local: ModeStorage;
  session: ModeStorage;
  // Demo: the recorded examples, read-only. Live: this browser's library.
  readLibrary: () => LibraryState;
};

const AppModeContext = createContext<AppModeValue | null>(null);

export function AppModeProvider({
  mode,
  examples,
  children,
}: {
  mode: AppMode;
  examples: ExampleSummary[];
  children: React.ReactNode;
}) {
  const value = useMemo<AppModeValue>(() => {
    const local = namespaced(mode, () => localStorage);
    const demoLibrary = exampleLibrary(examples);
    return {
      mode,
      examples,
      local,
      session: namespaced(mode, () => sessionStorage),
      readLibrary: () => (mode === "demo" ? demoLibrary : loadLibrary(local)),
    };
  }, [mode, examples]);
  return <AppModeContext.Provider value={value}>{children}</AppModeContext.Provider>;
}

export function useAppMode(): AppModeValue {
  const value = useContext(AppModeContext);
  if (!value) throw new Error("useAppMode needs an AppModeProvider above it");
  return value;
}
