import Dashboard from "./Dashboard";
import { appMode } from "@/lib/mode";
import { listExamples } from "@/lib/demoExamples";
import { AppModeProvider } from "@/lib/useAppMode";

// The deploy decides the mode, per request from server env, and hands it
// down; nothing in the browser can switch a demo deploy to live.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const mode = appMode();
  const examples = mode === "demo" ? await listExamples() : [];
  return (
    <AppModeProvider mode={mode} examples={examples}>
      <Dashboard />
    </AppModeProvider>
  );
}
