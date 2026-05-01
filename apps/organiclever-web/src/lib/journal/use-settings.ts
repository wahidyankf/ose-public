import { useState, useEffect, useCallback } from "react";
import type { JournalRuntime } from "./runtime";
import { getSettings, saveSettings } from "./settings-store";
import type { AppSettings } from "./settings-store";

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

export type SettingsState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; settings: AppSettings }
  | { status: "error"; error: unknown };

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSettings(runtime: JournalRuntime) {
  const [state, setState] = useState<SettingsState>({ status: "idle" });

  const load = useCallback(() => {
    setState({ status: "loading" });
    runtime.runPromise(getSettings()).then(
      (settings) => setState({ status: "ready", settings }),
      (error) => setState({ status: "error", error }),
    );
  }, [runtime]);

  useEffect(() => {
    load();
  }, [load]);

  const update = useCallback(
    (patch: Partial<AppSettings>) => {
      return runtime.runPromise(saveSettings(patch)).then(() => load());
    },
    [runtime, load],
  );

  return { state, update, reload: load };
}
