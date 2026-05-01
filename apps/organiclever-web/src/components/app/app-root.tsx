"use client";

import { useActor } from "@xstate/react";
import { useMemo, useEffect, useState } from "react";
import { appMachine } from "@/lib/app/app-machine";
import type { Tab } from "@/lib/app/app-machine";
import { makeJournalRuntime } from "@/lib/journal/runtime";
import { seedIfEmpty } from "@/lib/journal/seed";
import { saveSettings } from "@/lib/journal/settings-store";
import { TabBar } from "./tab-bar";
import { SideNav } from "./side-nav";
import { HomeScreen } from "./home/home-screen";

// ---------------------------------------------------------------------------
// Placeholder screens — real implementations are deferred to later phases
// ---------------------------------------------------------------------------

function PlaceholderScreen({ name }: { name: string }) {
  return (
    <div
      className="flex h-full items-center justify-center p-8 text-center"
      style={{ color: "var(--color-muted-foreground)" }}
    >
      {name} (coming soon)
    </div>
  );
}

// ---------------------------------------------------------------------------
// AppRoot
// ---------------------------------------------------------------------------

/**
 * Root shell of the OrganicLever web app.
 *
 * Responsibilities:
 * - Boots the XState `appMachine` (parallel: navigation × overlay)
 * - Creates the shared `JournalRuntime` (PGlite/Effect) once via useMemo
 * - Seeds the database on first load
 * - Syncs dark mode to DOM data-theme attribute + localStorage + PGlite
 * - Persists active tab to localStorage
 * - Detects desktop/mobile breakpoint (≥768px = desktop)
 * - Renders SideNav (desktop) or TabBar (mobile) based on breakpoint
 * - Routes content area to the appropriate screen based on machine state
 *
 * The provisional <JournalPage /> (gear-up debug panel) is intentionally
 * preserved at its original path (components/app/journal-page.tsx) for
 * debugging purposes. AppRoot replaces it as the production entry point.
 */
export function AppRoot() {
  // Delay hydration until after mount to avoid SSR/client mismatch on
  // localStorage reads (even though page.tsx is 'use client' + force-dynamic,
  // AppRoot itself should remain reusable in contexts without those guards).
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const initialDarkMode = useMemo(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("ol_dark_mode") === "true";
  }, []);

  const initialTab = useMemo((): Tab => {
    if (typeof window === "undefined") return "home";
    const stored = localStorage.getItem("ol_tab");
    if (stored === "home" || stored === "history" || stored === "progress" || stored === "settings") {
      return stored;
    }
    return "home";
  }, []);

  const [state, send] = useActor(appMachine, {
    input: { initialDarkMode, initialTab },
  });

  const runtime = useMemo(() => makeJournalRuntime(), []);

  // Sync dark mode → DOM data-theme + localStorage + PGlite
  useEffect(() => {
    const { darkMode } = state.context;
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
    localStorage.setItem("ol_dark_mode", String(darkMode));
    runtime.runPromise(saveSettings({ darkMode })).catch(() => {});
  }, [state.context.darkMode, runtime]);

  // Persist active tab
  useEffect(() => {
    localStorage.setItem("ol_tab", state.context.tab);
  }, [state.context.tab]);

  // Desktop breakpoint detection
  useEffect(() => {
    const check = () => send({ type: "SET_DESKTOP", isDesktop: window.innerWidth >= 768 });
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [send]);

  // Seed database on first mount
  useEffect(() => {
    runtime.runPromise(seedIfEmpty()).catch(() => {});
  }, [runtime]);

  // Avoid hydration mismatch — render nothing until mounted
  if (!mounted) return null;

  const { tab, isDesktop } = state.context;
  const isWorkout = state.matches({ navigation: "workout" });
  const isFinish = state.matches({ navigation: "finish" });
  const isEditRoutine = state.matches({ navigation: "editRoutine" });
  const isMain = state.matches({ navigation: "main" });

  // Content area routing
  const content = isWorkout ? (
    <PlaceholderScreen name="WorkoutScreen" />
  ) : isFinish ? (
    <PlaceholderScreen name="FinishScreen" />
  ) : isEditRoutine ? (
    <PlaceholderScreen name="EditRoutineScreen" />
  ) : tab === "history" ? (
    <PlaceholderScreen name="HistoryScreen" />
  ) : tab === "progress" ? (
    <PlaceholderScreen name="ProgressScreen" />
  ) : tab === "settings" ? (
    <PlaceholderScreen name="SettingsScreen" />
  ) : (
    <HomeScreen
      runtime={runtime}
      onStartWorkout={(routine) => send({ type: "START_WORKOUT", routine })}
      onEditRoutine={(routine) => send({ type: "EDIT_ROUTINE", routine })}
    />
  );

  // Desktop layout: SideNav + 480px content column
  if (isDesktop) {
    return (
      <div className="flex min-h-screen" style={{ background: "var(--color-background)" }}>
        {isMain && (
          <SideNav
            activeTab={tab}
            onNavigate={(t) => send({ type: "NAVIGATE_TAB", tab: t })}
            onLogEntry={() => send({ type: "OPEN_ADD_ENTRY" })}
          />
        )}
        <div
          className="mx-auto flex min-h-screen flex-1 flex-col shadow-lg"
          style={{
            maxWidth: 480,
            background: "var(--color-card)",
          }}
        >
          {content}
        </div>
      </div>
    );
  }

  // Mobile layout: content + TabBar (only shown on main navigation)
  return (
    <div className="flex min-h-screen flex-col" style={{ background: "var(--color-background)" }}>
      <div className="flex-1">{content}</div>
      {isMain && (
        <TabBar
          activeTab={tab}
          onNavigate={(t) => send({ type: "NAVIGATE_TAB", tab: t })}
          onFabPress={() => send({ type: "OPEN_ADD_ENTRY" })}
        />
      )}
    </div>
  );
}
