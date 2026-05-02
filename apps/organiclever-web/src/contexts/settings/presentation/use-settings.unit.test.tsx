import { describe, it, expect } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { Effect, Layer } from "effect";
import { PGlite } from "@electric-sql/pglite";
import { PgliteService, makeJournalRuntime } from "@/contexts/journal/infrastructure/runtime";
import { runMigrations } from "@/contexts/journal/infrastructure/run-migrations";
import { useSettings } from "./use-settings";

// ---------------------------------------------------------------------------
// Test runtime factory — in-memory PGlite with all migrations applied
// ---------------------------------------------------------------------------

function makeTestRuntime() {
  const testLayer = Layer.scoped(
    PgliteService,
    Effect.acquireRelease(
      Effect.promise(async () => {
        const db = new PGlite();
        await runMigrations(db);
        return { db };
      }),
      ({ db }) => Effect.promise(() => db.close()),
    ),
  );
  return makeJournalRuntime(testLayer);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useSettings", () => {
  it("transitions from loading to ready with default settings", async () => {
    const runtime = makeTestRuntime();
    const { result, unmount } = renderHook(() => useSettings(runtime));

    // Initially loading (hook sets loading on mount)
    expect(result.current.state.status).toBe("loading");

    // Wait for ready
    await waitFor(
      () => {
        expect(result.current.state.status).toBe("ready");
      },
      { timeout: 10000 },
    );

    if (result.current.state.status === "ready") {
      expect(result.current.state.settings.name).toBe("User");
      expect(result.current.state.settings.restSeconds).toBe(60);
      expect(result.current.state.settings.darkMode).toBe(false);
      expect(result.current.state.settings.lang).toBe("en");
    }

    unmount();
    await runtime.dispose();
  });

  it("update saves patch and reloads with new values", async () => {
    const runtime = makeTestRuntime();
    const { result, unmount } = renderHook(() => useSettings(runtime));

    await waitFor(
      () => {
        expect(result.current.state.status).toBe("ready");
      },
      { timeout: 10000 },
    );

    await act(async () => {
      await result.current.update({ name: "Bob" });
    });

    await waitFor(
      () => {
        if (result.current.state.status === "ready") {
          expect(result.current.state.settings.name).toBe("Bob");
        }
      },
      { timeout: 10000 },
    );

    if (result.current.state.status === "ready") {
      expect(result.current.state.settings.name).toBe("Bob");
      // Other fields unchanged
      expect(result.current.state.settings.restSeconds).toBe(60);
      expect(result.current.state.settings.darkMode).toBe(false);
      expect(result.current.state.settings.lang).toBe("en");
    }

    unmount();
    await runtime.dispose();
  });
});
