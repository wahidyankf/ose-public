"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FinishScreen } from "@/contexts/workout-session/presentation";
import { useAppRuntime } from "@/contexts/app-shell/presentation/app-runtime-context";
import type { CompletedSession } from "@/contexts/app-shell/presentation/app-machine";

/**
 * /app/workout/finish — shows the post-workout summary. Reads completedSession
 * from AppRuntime context; if none (e.g. user opened the URL directly without
 * finishing a workout), redirects back to /app/home.
 */
export default function FinishPage() {
  const router = useRouter();
  const { completedSession, setCompletedSession } = useAppRuntime();
  const [snapshot, setSnapshot] = useState<CompletedSession | null>(completedSession);

  useEffect(() => {
    if (completedSession === null && snapshot === null) {
      router.replace("/app/home");
    } else if (completedSession !== null) {
      setSnapshot(completedSession);
    }
  }, [completedSession, snapshot, router]);

  if (!snapshot) return null;

  const handleBack = () => {
    setCompletedSession(null);
    router.push("/app/home");
  };

  return <FinishScreen completedSession={snapshot} onBack={handleBack} />;
}
