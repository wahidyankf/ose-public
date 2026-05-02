"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useActor } from "@xstate/react";
import { appMachine } from "@/lib/app/app-machine";
import type { CompletedSession } from "@/lib/app/app-machine";
import type { Routine } from "@/lib/journal/routine-store";
import { makeJournalRuntime } from "@/lib/journal/runtime";
import { seedIfEmpty } from "@/lib/journal/seed";
import { saveSettings } from "@/contexts/settings/application";
import { TabBar } from "@/components/app/tab-bar";
import { SideNav } from "@/components/app/side-nav";
import { OverlayTree } from "@/components/app/overlay-tree";
import { AppRuntimeProvider, type AppRuntimeContextValue } from "@/components/app/app-runtime-context";

const MAIN_TAB_PATHS: ReadonlySet<string> = new Set(["/app/home", "/app/history", "/app/progress", "/app/settings"]);

function isMainTabPath(pathname: string | null): boolean {
  return MAIN_TAB_PATHS.has(pathname ?? "");
}

/**
 * Layout for the /app/ route segment.
 *
 * Owns:
 * - JournalRuntime (shared PGlite + Effect runtime)
 * - appMachine (overlay region + dark mode + breakpoint context)
 * - dark-mode sync to <html data-theme>, localStorage, and PGlite settings
 * - desktop breakpoint detection
 * - one-shot DB seeding
 * - SideNav (desktop) / TabBar (mobile) — only on a main-tab path
 * - shared overlay tree (Add Entry sheet, four loggers, custom logger)
 *
 * The page.tsx files under /app/ remain thin and read shared state via
 * useAppRuntime().
 */
export default function AppsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const initialDarkMode = useMemo(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("ol_dark_mode") === "true";
  }, []);

  const [state, send] = useActor(appMachine, {
    input: { initialDarkMode, initialTab: "home" },
  });

  const runtime = useMemo(() => makeJournalRuntime(), []);

  const [refreshKey, setRefreshKey] = useState(0);
  const refreshHome = useCallback(() => setRefreshKey((k) => k + 1), []);

  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [completedSession, setCompletedSession] = useState<CompletedSession | null>(null);

  // Sync dark mode → DOM data-theme + localStorage + PGlite
  useEffect(() => {
    const { darkMode } = state.context;
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
    localStorage.setItem("ol_dark_mode", String(darkMode));
    runtime.runPromise(saveSettings({ darkMode })).catch(() => {});
  }, [state.context.darkMode, runtime]);

  // Desktop breakpoint detection
  useEffect(() => {
    const check = () => send({ type: "SET_DESKTOP", isDesktop: window.innerWidth >= 768 });
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [send]);

  // Seed DB once
  useEffect(() => {
    runtime.runPromise(seedIfEmpty()).catch(() => {});
  }, [runtime]);

  // Apply app-mode body class while inside /app/ tree
  useEffect(() => {
    document.body.classList.add("app-mode");
    return () => {
      document.body.classList.remove("app-mode");
    };
  }, []);

  const openAddEntry = useCallback(() => send({ type: "OPEN_ADD_ENTRY" }), [send]);

  const ctxValue: AppRuntimeContextValue = useMemo(
    () => ({
      runtime,
      state,
      send,
      refreshKey,
      refreshHome,
      openAddEntry,
      activeRoutine,
      setActiveRoutine,
      editingRoutine,
      setEditingRoutine,
      completedSession,
      setCompletedSession,
    }),
    [runtime, state, send, refreshKey, refreshHome, openAddEntry, activeRoutine, editingRoutine, completedSession],
  );

  // Avoid hydration mismatch — render nothing until mounted
  if (!mounted) return null;

  const showChrome = isMainTabPath(pathname);
  const { isDesktop } = state.context;

  return (
    <AppRuntimeProvider value={ctxValue}>
      <meta name="robots" content="noindex" />
      {isDesktop ? (
        <div className="flex min-h-screen" style={{ background: "var(--color-background)" }}>
          {showChrome && <SideNav onLogEntry={openAddEntry} />}
          <div
            className="mx-auto flex min-h-screen flex-1 flex-col shadow-lg"
            style={{
              maxWidth: 480,
              background: "var(--color-card)",
            }}
          >
            {children}
          </div>
        </div>
      ) : (
        <div className="flex min-h-screen flex-col" style={{ background: "var(--color-background)" }}>
          <div className="flex-1" style={{ paddingBottom: showChrome ? 64 : 0 }}>
            {children}
          </div>
          {showChrome && <TabBar onFabPress={openAddEntry} />}
        </div>
      )}
      <OverlayTree />
    </AppRuntimeProvider>
  );
}
