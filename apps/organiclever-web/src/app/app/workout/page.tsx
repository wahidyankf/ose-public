"use client";

export const dynamic = "force-dynamic";

import { useRouter } from "next/navigation";
import { WorkoutScreen } from "@/components/app/workout/workout-screen";
import { useAppRuntime } from "@/components/app/app-runtime-context";
import { useSettings } from "@/contexts/settings/presentation";
import type { AppSettings } from "@/contexts/settings/application";

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

  // A null activeRoutine is intentional quick-start mode; no redirect needed.

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
