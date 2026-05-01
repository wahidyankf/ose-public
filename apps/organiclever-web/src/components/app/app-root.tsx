"use client";

import { useActor } from "@xstate/react";
import { useMemo, useEffect, useState, useCallback } from "react";
import { appMachine } from "@/lib/app/app-machine";
import type { Tab } from "@/lib/app/app-machine";
import { makeJournalRuntime } from "@/lib/journal/runtime";
import { seedIfEmpty } from "@/lib/journal/seed";
import { saveSettings } from "@/lib/journal/settings-store";
import { TabBar } from "./tab-bar";
import { SideNav } from "./side-nav";
import { HomeScreen } from "./home/home-screen";
import { AddEntrySheet } from "./add-entry-sheet";
import { ReadingLogger } from "./loggers/reading-logger";
import { LearningLogger } from "./loggers/learning-logger";
import { MealLogger } from "./loggers/meal-logger";
import { FocusLogger } from "./loggers/focus-logger";
import { CustomEntryLogger } from "./loggers/custom-entry-logger";
import { WorkoutScreen } from "./workout/workout-screen";
import { FinishScreen } from "./workout/finish-screen";
import { EditRoutineScreen } from "./routine/edit-routine-screen";
import { HistoryScreen } from "./history/history-screen";
import { ProgressScreen } from "./progress/progress-screen";
import { SettingsScreen } from "./settings/settings-screen";
import { useSettings } from "@/lib/journal/use-settings";
import type { AppSettings } from "@/lib/journal/settings-store";

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

  // Load app settings (needed for WorkoutScreen's resolvedRest calculation)
  const { state: settingsState } = useSettings(runtime);
  const settings: AppSettings | null = settingsState.status === "ready" ? settingsState.settings : null;

  // Bump this key to trigger HomeScreen data reload after a logger saves
  const [homeRefreshKey, setHomeRefreshKey] = useState(0);
  const refreshHome = useCallback(() => setHomeRefreshKey((k) => k + 1), []);

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

  const { tab, isDesktop, loggerKind, customLoggerName } = state.context;
  const isWorkout = state.matches({ navigation: "workout" });
  const isFinish = state.matches({ navigation: "finish" });
  const isEditRoutine = state.matches({ navigation: "editRoutine" });
  const isMain = state.matches({ navigation: "main" });
  const isAddEntryOpen = state.matches({ overlay: "addEntry" });
  const isLoggerOpen = state.matches({ overlay: "loggerOpen" });
  const isCustomLoggerOpen = state.matches({ overlay: "customLoggerOpen" });

  /**
   * Handle selection from AddEntrySheet.
   * - "workout" → start workout flow
   * - known logger kinds → open logger overlay
   * - "custom" → open custom logger
   */
  function handleSelectEntry(kind: string) {
    send({ type: "CLOSE_ADD_ENTRY" });
    if (kind === "workout") {
      send({ type: "START_WORKOUT" });
    } else if (kind === "reading" || kind === "learning" || kind === "meal" || kind === "focus") {
      send({ type: "OPEN_LOGGER", kind });
    } else {
      send({ type: "OPEN_CUSTOM_LOGGER", name: kind });
    }
  }

  function handleLoggerSaved() {
    send({ type: "CLOSE_LOGGER" });
    refreshHome();
  }

  function handleCustomLoggerSaved() {
    send({ type: "CLOSE_CUSTOM_LOGGER" });
    refreshHome();
  }

  // Default settings fallback (used until PGlite loads)
  const defaultSettings: AppSettings = {
    name: "User",
    restSeconds: 60,
    darkMode: state.context.darkMode,
    lang: "en",
  };
  const effectiveSettings = settings ?? defaultSettings;

  // Content area routing
  const content = isWorkout ? (
    <WorkoutScreen
      routine={state.context.routine}
      settings={effectiveSettings}
      runtime={runtime}
      onFinishWorkout={(session) => {
        send({ type: "FINISH_WORKOUT", session });
        refreshHome();
      }}
      onBack={() => send({ type: "BACK_TO_MAIN" })}
    />
  ) : isFinish ? (
    state.context.completedSession ? (
      <FinishScreen completedSession={state.context.completedSession} onBack={() => send({ type: "BACK_TO_MAIN" })} />
    ) : (
      <PlaceholderScreen name="FinishScreen" />
    )
  ) : isEditRoutine ? (
    <EditRoutineScreen
      routine={state.context.routine}
      runtime={runtime}
      onSave={() => {
        send({ type: "BACK_TO_MAIN" });
        refreshHome();
      }}
      onBack={() => send({ type: "BACK_TO_MAIN" })}
    />
  ) : tab === "history" ? (
    <HistoryScreen runtime={runtime} refreshKey={homeRefreshKey} />
  ) : tab === "progress" ? (
    <ProgressScreen runtime={runtime} refreshKey={homeRefreshKey} />
  ) : tab === "settings" ? (
    <SettingsScreen
      runtime={runtime}
      darkMode={state.context.darkMode}
      onToggleDarkMode={() => send({ type: "TOGGLE_DARK_MODE" })}
    />
  ) : (
    <HomeScreen
      key={homeRefreshKey}
      runtime={runtime}
      onStartWorkout={(routine) => send({ type: "START_WORKOUT", routine })}
      onEditRoutine={(routine) => send({ type: "EDIT_ROUTINE", routine })}
    />
  );

  // Overlay components rendered above the layout tree
  const overlays = (
    <>
      <AddEntrySheet
        isOpen={isAddEntryOpen}
        onClose={() => send({ type: "CLOSE_ADD_ENTRY" })}
        onSelectEntry={handleSelectEntry}
      />
      <ReadingLogger
        isOpen={isLoggerOpen && loggerKind === "reading"}
        onClose={() => send({ type: "CLOSE_LOGGER" })}
        onSaved={handleLoggerSaved}
        runtime={runtime}
      />
      <LearningLogger
        isOpen={isLoggerOpen && loggerKind === "learning"}
        onClose={() => send({ type: "CLOSE_LOGGER" })}
        onSaved={handleLoggerSaved}
        runtime={runtime}
      />
      <MealLogger
        isOpen={isLoggerOpen && loggerKind === "meal"}
        onClose={() => send({ type: "CLOSE_LOGGER" })}
        onSaved={handleLoggerSaved}
        runtime={runtime}
      />
      <FocusLogger
        isOpen={isLoggerOpen && loggerKind === "focus"}
        onClose={() => send({ type: "CLOSE_LOGGER" })}
        onSaved={handleLoggerSaved}
        runtime={runtime}
      />
      <CustomEntryLogger
        isOpen={isCustomLoggerOpen}
        onClose={() => send({ type: "CLOSE_CUSTOM_LOGGER" })}
        onSaved={handleCustomLoggerSaved}
        runtime={runtime}
        initialName={customLoggerName ?? undefined}
      />
    </>
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
        {overlays}
      </div>
    );
  }

  // Mobile layout: content + fixed TabBar (only shown on main navigation)
  return (
    <div className="flex min-h-screen flex-col" style={{ background: "var(--color-background)" }}>
      <div className="flex-1" style={{ paddingBottom: isMain ? 64 : 0 }}>
        {content}
      </div>
      {isMain && (
        <TabBar
          activeTab={tab}
          onNavigate={(t) => send({ type: "NAVIGATE_TAB", tab: t })}
          onFabPress={() => send({ type: "OPEN_ADD_ENTRY" })}
        />
      )}
      {overlays}
    </div>
  );
}
