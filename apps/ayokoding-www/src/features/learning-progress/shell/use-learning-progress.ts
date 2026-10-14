"use client";

import { useSyncExternalStore } from "react";
import { learningProgressStore, type ProgressSnapshot } from "./progress-storage";

/**
 * The browser progress snapshot (plan 04, tech-docs/002 Hook). During server rendering and
 * hydration React uses the frozen `{ status: "unknown" }` server snapshot, so the first client
 * render matches the server HTML exactly; React then re-renders with the real snapshot.
 */
export function useLearningProgress(): ProgressSnapshot {
  return useSyncExternalStore(
    learningProgressStore.subscribe,
    learningProgressStore.getSnapshot,
    learningProgressStore.getServerSnapshot,
  );
}
