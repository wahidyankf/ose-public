"use client";

export const dynamic = "force-dynamic";

import { SettingsScreen } from "@/contexts/settings/presentation";
import { useAppRuntime } from "@/contexts/app-shell/presentation/app-runtime-context";

export default function SettingsPage() {
  const { runtime, state, send } = useAppRuntime();
  return (
    <SettingsScreen
      runtime={runtime}
      darkMode={state.context.darkMode}
      onToggleDarkMode={() => send({ type: "TOGGLE_DARK_MODE" })}
    />
  );
}
