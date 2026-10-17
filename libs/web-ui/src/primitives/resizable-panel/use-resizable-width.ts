"use client";

import { useEffect, useState } from "react";

import { clampWidth, DEFAULT_WIDTH, MAX_PCT, MIN_PCT, parsePersistedWidth } from "./width-model";

export interface UseResizableWidthOptions {
  /** `localStorage` key under which the width is persisted. */
  storageKey: string;
  /** Width to use when no persisted value exists. Defaults to `DEFAULT_WIDTH`. */
  defaultWidth?: number;
  /** Lower band bound, as a percentage of the viewport, used to re-clamp a persisted value on mount. Defaults to `MIN_PCT`. */
  minPct?: number;
  /** Upper band bound, as a percentage of the viewport, used to re-clamp a persisted value on mount. Defaults to `MAX_PCT`. */
  maxPct?: number;
  /**
   * Viewport width in pixels, used to re-clamp a persisted value on mount. Defaults to
   * `window.innerWidth`, read inside the mount effect (never during render).
   */
  viewportPx?: number;
}

export interface UseResizableWidthResult {
  /** The current panel width, in pixels. */
  width: number;
  /**
   * Updates the width for live visual feedback only — updates state but does NOT persist to
   * `localStorage`. Intended for every intermediate `pointermove` of an in-progress drag, so a
   * fast drag doesn't fire the synchronous, main-thread-blocking `localStorage.setItem` dozens of
   * times per second. Callers are responsible for clamping the value first, same as `commitWidth`.
   */
  updateWidth: (nextWidth: number) => void;
  /**
   * Commits a new width: updates state and persists it to `localStorage`.
   *
   * Callers are responsible for clamping the value (via `width-model.ts`'s
   * `clampWidth`) before calling this — the hook itself performs no clamping
   * on this path. The mount-read path below clamps a persisted value itself,
   * since that value may be stale, corrupted, or tampered with.
   *
   * Intended for discrete, single-shot interactions — drag end (`pointerup`), a keyboard
   * Arrow-key step, Home/End, or the double-click reset. NOT for every intermediate
   * `pointermove` of a drag; use `updateWidth` for that (see its docstring for why).
   */
  commitWidth: (nextWidth: number) => void;
}

/**
 * Manages a resizable panel's width, mirroring `theme-toggle.tsx`'s mount-effect
 * `localStorage` pattern: read the persisted value once on mount, and persist on every commit.
 */
export function useResizableWidth({
  storageKey,
  defaultWidth = DEFAULT_WIDTH,
  minPct = MIN_PCT,
  maxPct = MAX_PCT,
  viewportPx,
}: UseResizableWidthOptions): UseResizableWidthResult {
  const [width, setWidth] = useState(defaultWidth);

  useEffect(() => {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(storageKey);
    } catch {
      raw = null;
    }
    const persisted = parsePersistedWidth(raw);
    if (persisted !== undefined) {
      const resolvedViewportPx = viewportPx ?? window.innerWidth;
      setWidth(clampWidth(persisted, resolvedViewportPx, minPct, maxPct));
    }
    // Intentionally mirrors theme-toggle.tsx: read once on mount / when the key changes.
  }, [storageKey, minPct, maxPct, viewportPx]);

  const updateWidth = (nextWidth: number) => {
    setWidth(nextWidth);
  };

  const commitWidth = (nextWidth: number) => {
    setWidth(nextWidth);
    try {
      localStorage.setItem(storageKey, String(nextWidth));
    } catch {
      // Storage can be blocked; the width still applies for this session.
    }
  };

  return { width, updateWidth, commitWidth };
}
