"use client";

export const dynamic = "force-dynamic";

import { ProgressScreen } from "@/contexts/stats/presentation";
import { useAppRuntime } from "@/contexts/app-shell/presentation/app-runtime-context";

export default function ProgressPage() {
  const { runtime, refreshKey } = useAppRuntime();
  return <ProgressScreen runtime={runtime} refreshKey={refreshKey} />;
}
