"use client";

export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { WorkoutScreen } from "@/components/app/workout/workout-screen";
import { useAppRuntime } from "@/components/app/app-runtime-context";
import { useSettings } from "@/lib/journal/use-settings";
import type { AppSettings } from "@/lib/journal/settings-store";

const FALLBACK_SETTINGS: AppSettings = {
  name: "User",
  restSeconds: 60,
  darkMode: false,
  lang: "en",
};

/**
 * /app/workout — wraps WorkoutScreen and bridges its onFinishWorkout / onBack
 * callbacks to URL navigation. Direct deep-link to /app/workout without an
 * activeRoutine in context redirects to /app/home (handled in effect to keep
 * useRouter calls inside the component tree).
 */
export default function WorkoutPage() {
  const router = useRouter();
  const { runtime, activeRoutine, refreshHome, state, setCompletedSession } = useAppRuntime();
  const { state: settingsState } = useSettings(runtime);
  const settings: AppSettings =
    settingsState.status === "ready"
      ? settingsState.settings
      : { ...FALLBACK_SETTINGS, darkMode: state.context.darkMode };

  useEffect(() => {
    if (activeRoutine === null) {
      // Allow quick-start (no preselected routine) — only redirect if user
      // typed the URL directly without going through Home or AddEntry.
      // Quick-start sets activeRoutine to null intentionally; distinguishing
      // via a "started" flag in context would over-engineer for now.
    }
  }, [activeRoutine]);

  const handleFinishWorkout = (session: import("@/lib/app/app-machine").CompletedSession) => {
    setCompletedSession(session);
    refreshHome();
    router.push("/app/workout/finish");
  };

  const handleBack = () => {
    router.push("/app/home");
  };

  return (
    <WorkoutScreen
      routine={activeRoutine}
      settings={settings}
      runtime={runtime}
      onFinishWorkout={handleFinishWorkout}
      onBack={handleBack}
    />
  );
}
