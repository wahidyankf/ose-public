"use client";

export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { AppRoot } from "@/components/app/app-root";

/**
 * /app route entry point.
 * Mounts <AppRoot /> — the full application shell (navigation, TabBar/SideNav, screens).
 *
 * Adds "app-mode" class to <body> for app-specific global styles (e.g. no scroll on
 * the marketing layout), removed on unmount.
 *
 * The provisional <JournalPage /> (gear-up debug component) is preserved at
 * components/app/journal-page.tsx for development reference — it is no longer
 * rendered by this route.
 */
export default function AppPage() {
  useEffect(() => {
    document.body.classList.add("app-mode");
    return () => {
      document.body.classList.remove("app-mode");
    };
  }, []);

  return <AppRoot />;
}
