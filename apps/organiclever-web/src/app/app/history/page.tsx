"use client";

export const dynamic = "force-dynamic";

import { HistoryScreen } from "@/contexts/stats/presentation";
import { useAppRuntime } from "@/components/app/app-runtime-context";

export default function HistoryPage() {
  const { runtime, refreshKey } = useAppRuntime();
  return <HistoryScreen runtime={runtime} refreshKey={refreshKey} />;
}
