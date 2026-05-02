"use client";

export const dynamic = "force-dynamic";

import { ProgressScreen } from "@/components/app/progress/progress-screen";
import { useAppRuntime } from "@/components/app/app-runtime-context";

export default function ProgressPage() {
  const { runtime, refreshKey } = useAppRuntime();
  return <ProgressScreen runtime={runtime} refreshKey={refreshKey} />;
}
