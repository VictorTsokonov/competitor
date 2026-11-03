// The demo's recorded runs, one line each, in display order: Example 1, 2, …
// Record with `npx tsx scripts/record-example.ts <fixture-id>`, then add
// the line the script prints. Loaded and validated by lib/demoExamples.ts.

export const EXAMPLE_FILES: Record<number, () => Promise<{ default: unknown }>> = {
  1: () => import("./example-1.json"),
  2: () => import("./example-2.json"),
  3: () => import("./example-3.json"),
  4: () => import("./example-4.json"),
};
