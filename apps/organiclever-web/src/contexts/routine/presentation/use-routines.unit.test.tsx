import { describe, it, expect } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { Effect, Layer } from "effect";
import { PGlite } from "@electric-sql/pglite";
import { PgliteService, makeJournalRuntime } from "@/contexts/journal/application";
import { runMigrations } from "@/contexts/journal/application";
import { useRoutines } from "./use-routines";
import type { Routine } from "../domain";

// ---------------------------------------------------------------------------
// Test runtime factory — in-memory PGlite with both migrations
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
// Helpers
// ---------------------------------------------------------------------------

function makeRoutine(overrides: Partial<Routine> = {}): Routine {
  return {
    id: crypto.randomUUID(),
    name: "Test Routine",
    hue: "teal",
    type: "workout",
    createdAt: new Date().toISOString(),
    groups: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useRoutines", () => {
  it("transitions from loading to ready with empty routines", async () => {
    const runtime = makeTestRuntime();
    const { result, unmount } = renderHook(() => useRoutines(runtime));

    // Initially loading
    expect(result.current.state.status).toBe("loading");

    // Wait for ready
    await waitFor(
      () => {
        expect(result.current.state.status).toBe("ready");
      },
      { timeout: 30000 },
    );

    if (result.current.state.status === "ready") {
      expect(result.current.state.routines).toHaveLength(0);
    }

    unmount();
    await runtime.dispose();
  });

  it("save inserts a routine and reloads", async () => {
    const runtime = makeTestRuntime();
    const { result, unmount } = renderHook(() => useRoutines(runtime));

    await waitFor(
      () => {
        expect(result.current.state.status).toBe("ready");
      },
      { timeout: 30000 },
    );

    const r = makeRoutine({ name: "Push Day" });

    await act(async () => {
      await result.current.save(r);
    });

    await waitFor(
      () => {
        if (result.current.state.status === "ready") {
          expect(result.current.state.routines).toHaveLength(1);
        }
      },
      { timeout: 30000 },
    );

    if (result.current.state.status === "ready") {
      expect(result.current.state.routines[0]?.name).toBe("Push Day");
    }

    unmount();
    await runtime.dispose();
  });
});
