import { describe, it, expect } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { Effect, Layer } from "effect";
import { PGlite } from "@electric-sql/pglite";
import { PgliteService, makeJournalRuntime } from "@/contexts/journal/application";
import { runMigrations } from "@/contexts/journal/application";
import { useRoutines } from "../../../../../src/contexts/routine/presentation/use-routines";
import type { Routine } from "../../../../../src/contexts/routine/domain";
import { FIXED_INSTANT, nextFixtureId } from "../../../support/doubles";

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
    id: nextFixtureId(),
    name: "Test Routine",
    hue: "teal",
    type: "workout",
    createdAt: FIXED_INSTANT,
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

  it("remove deletes a routine and reloads", async () => {
    const runtime = makeTestRuntime();
    const { result, unmount } = renderHook(() => useRoutines(runtime));

    await waitFor(() => expect(result.current.state.status).toBe("ready"), { timeout: 30000 });

    const r = makeRoutine({ name: "Leg Day" });
    await act(async () => {
      await result.current.save(r);
    });
    await waitFor(() => {
      if (result.current.state.status === "ready") {
        expect(result.current.state.routines).toHaveLength(1);
      }
    });

    await act(async () => {
      await result.current.remove(r.id);
    });

    await waitFor(() => {
      if (result.current.state.status === "ready") {
        expect(result.current.state.routines).toHaveLength(0);
      }
    });

    unmount();
    await runtime.dispose();
  });

  it("reorder moves an exercise within a group and reloads", async () => {
    const runtime = makeTestRuntime();
    const { result, unmount } = renderHook(() => useRoutines(runtime));

    await waitFor(() => expect(result.current.state.status).toBe("ready"), { timeout: 30000 });

    const exercise = (id: string, name: string) => ({
      id,
      name,
      type: "reps" as const,
      targetSets: 3,
      targetReps: 10,
      targetWeight: null,
      targetDuration: null,
      timerMode: "countdown" as const,
      bilateral: false,
      dayStreak: 0,
      restSeconds: null,
    });
    const group = {
      id: nextFixtureId(),
      name: "Main Lifts",
      exercises: [exercise("e1", "Squat"), exercise("e2", "Deadlift")],
    };
    const r = makeRoutine({ name: "Pull Day", groups: [group] });

    await act(async () => {
      await result.current.save(r);
    });
    await waitFor(() => {
      if (result.current.state.status === "ready") {
        expect(result.current.state.routines).toHaveLength(1);
      }
    });

    await act(async () => {
      await result.current.reorder(r.id, group.id, 0, 1);
    });

    await waitFor(() => {
      if (result.current.state.status === "ready") {
        const reordered = result.current.state.routines[0]?.groups[0]?.exercises;
        expect(reordered?.[0]?.id).toBe("e2");
      }
    });

    unmount();
    await runtime.dispose();
  });

  it("transitions to error state when the initial load fails", async () => {
    const failingLayer = Layer.scoped(
      PgliteService,
      Effect.acquireRelease(
        Effect.sync(() => ({
          db: {
            query: () => Promise.reject(new Error("connection lost")),
          } as unknown as PGlite,
        })),
        () => Effect.void,
      ),
    );
    const runtime = makeJournalRuntime(failingLayer);
    const { result, unmount } = renderHook(() => useRoutines(runtime));

    await waitFor(() => expect(result.current.state.status).toBe("error"), { timeout: 30000 });

    unmount();
    await runtime.dispose();
  });
});
