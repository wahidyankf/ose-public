import { describe, it, expect, vi } from "vitest";
import { createActor } from "xstate";
import { workoutSessionMachine, resolvedRest } from "./workout-machine";
import type { AppSettings } from "@/contexts/settings/application";
import type { Routine } from "@/lib/journal/routine-store";
import type { JournalRuntime } from "@/contexts/journal/infrastructure/runtime";
import type { CompletedSet, ActiveExercise } from "@/contexts/journal/domain/typed-payloads";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockSettings: AppSettings = {
  name: "Tester",
  restSeconds: 60,
  darkMode: false,
  lang: "en",
};

const mockRuntime = {
  runPromise: vi.fn().mockResolvedValue([]),
} as unknown as JournalRuntime;

const mockExercise: ActiveExercise = {
  id: "ex-1",
  name: "Push-up",
  type: "reps",
  targetSets: 3,
  targetReps: 10,
  targetWeight: null,
  targetDuration: null,
  timerMode: "countdown",
  bilateral: false,
  dayStreak: 0,
  restSeconds: null,
  sets: [],
};

const mockRoutine: Routine = {
  id: "r-1",
  name: "Test Routine",
  hue: "teal",
  type: "workout",
  createdAt: "2026-01-01T00:00:00.000Z",
  groups: [
    {
      id: "g-1",
      name: "Main",
      exercises: [
        {
          id: "ex-1",
          name: "Push-up",
          type: "reps",
          targetSets: 3,
          targetReps: 10,
          targetWeight: null,
          targetDuration: null,
          timerMode: "countdown",
          bilateral: false,
          dayStreak: 0,
          restSeconds: 30,
        },
      ],
    },
  ],
};

const mockRoutineNoRest: Routine = {
  ...mockRoutine,
  id: "r-2",
  groups: [
    {
      id: "g-1",
      name: "Main",
      exercises: [
        {
          id: "ex-1",
          name: "Push-up",
          type: "reps",
          targetSets: 3,
          targetReps: 10,
          targetWeight: null,
          targetDuration: null,
          timerMode: "countdown",
          bilateral: false,
          dayStreak: 0,
          restSeconds: 0,
        },
      ],
    },
  ],
};

const completedSet: CompletedSet = {
  reps: 10,
  weight: null,
  duration: null,
  restTaken: null,
};

function makeActor(routine: Routine | null = null, settings = mockSettings) {
  return createActor(workoutSessionMachine, {
    input: { routine, settings, runtime: mockRuntime },
  });
}

// ---------------------------------------------------------------------------
// resolvedRest unit tests
// ---------------------------------------------------------------------------

describe("resolvedRest", () => {
  it("uses exercise.restSeconds when not null", () => {
    const ex = { ...mockExercise, restSeconds: 45 };
    expect(resolvedRest(ex, mockSettings)).toBe(45);
  });

  it("returns targetReps when settings.restSeconds is 'reps'", () => {
    const settings: AppSettings = { ...mockSettings, restSeconds: "reps" };
    const ex = { ...mockExercise, restSeconds: null, targetReps: 15 };
    expect(resolvedRest(ex, settings)).toBe(15);
  });

  it("returns targetReps * 2 when settings.restSeconds is 'reps2'", () => {
    const settings: AppSettings = { ...mockSettings, restSeconds: "reps2" };
    const ex = { ...mockExercise, restSeconds: null, targetReps: 15 };
    expect(resolvedRest(ex, settings)).toBe(30);
  });

  it("returns 0 when settings.restSeconds is 0", () => {
    const settings: AppSettings = { ...mockSettings, restSeconds: 0 };
    const ex = { ...mockExercise, restSeconds: null };
    expect(resolvedRest(ex, settings)).toBe(0);
  });

  it("returns numeric setting (60) as fallback", () => {
    const settings: AppSettings = { ...mockSettings, restSeconds: 60 };
    const ex = { ...mockExercise, restSeconds: null };
    expect(resolvedRest(ex, settings)).toBe(60);
  });
});

// ---------------------------------------------------------------------------
// Machine state transitions
// ---------------------------------------------------------------------------

describe("workoutSessionMachine", () => {
  it("starts in idle state", () => {
    const actor = makeActor();
    actor.start();
    expect(actor.getSnapshot().value).toBe("idle");
    actor.stop();
  });

  it("START transitions from idle to active.exercising", () => {
    const actor = makeActor();
    actor.start();
    actor.send({ type: "START" });
    const snap = actor.getSnapshot();
    expect(snap.matches("active.exercising")).toBe(true);
    actor.stop();
  });

  it("START with routine initializes exercises", () => {
    const actor = makeActor(mockRoutine);
    actor.start();
    actor.send({ type: "START" });
    const snap = actor.getSnapshot();
    expect(snap.context.exercises).toHaveLength(1);
    expect(snap.context.exercises[0]?.name).toBe("Push-up");
    expect(snap.context.exercises[0]?.sets).toEqual([]);
    actor.stop();
  });

  it("START without routine initializes empty exercises", () => {
    const actor = makeActor(null);
    actor.start();
    actor.send({ type: "START" });
    const snap = actor.getSnapshot();
    expect(snap.context.exercises).toHaveLength(0);
    actor.stop();
  });

  it("TICK in exercising increments elapsedSecs", () => {
    const actor = makeActor();
    actor.start();
    actor.send({ type: "START" });
    actor.send({ type: "TICK" });
    actor.send({ type: "TICK" });
    expect(actor.getSnapshot().context.elapsedSecs).toBe(2);
    actor.stop();
  });

  it("LOG_SET with rest > 0 transitions to active.resting", () => {
    const actor = makeActor(mockRoutine);
    actor.start();
    actor.send({ type: "START" });
    actor.send({ type: "LOG_SET", exerciseIdx: 0, setData: completedSet });
    const snap = actor.getSnapshot();
    expect(snap.matches("active.resting")).toBe(true);
    expect(snap.context.restSecsLeft).toBe(30);
    actor.stop();
  });

  it("LOG_SET with rest = 0 stays in active.exercising", () => {
    const actor = makeActor(mockRoutineNoRest);
    actor.start();
    actor.send({ type: "START" });
    actor.send({ type: "LOG_SET", exerciseIdx: 0, setData: completedSet });
    const snap = actor.getSnapshot();
    expect(snap.matches("active.exercising")).toBe(true);
    actor.stop();
  });

  it("SKIP_REST from resting returns to active.exercising", () => {
    const actor = makeActor(mockRoutine);
    actor.start();
    actor.send({ type: "START" });
    actor.send({ type: "LOG_SET", exerciseIdx: 0, setData: completedSet });
    actor.send({ type: "SKIP_REST" });
    expect(actor.getSnapshot().matches("active.exercising")).toBe(true);
    actor.stop();
  });

  it("TICK in resting decrements restSecsLeft", () => {
    const actor = makeActor(mockRoutine);
    actor.start();
    actor.send({ type: "START" });
    actor.send({ type: "LOG_SET", exerciseIdx: 0, setData: completedSet });
    const before = actor.getSnapshot().context.restSecsLeft;
    actor.send({ type: "TICK" });
    expect(actor.getSnapshot().context.restSecsLeft).toBe(before - 1);
    actor.stop();
  });

  it("TICK in resting also increments elapsedSecs", () => {
    const actor = makeActor(mockRoutine);
    actor.start();
    actor.send({ type: "START" });
    // Elapsed was 0 after START
    actor.send({ type: "LOG_SET", exerciseIdx: 0, setData: completedSet });
    const elapsedBefore = actor.getSnapshot().context.elapsedSecs;
    actor.send({ type: "TICK" });
    expect(actor.getSnapshot().context.elapsedSecs).toBe(elapsedBefore + 1);
    actor.stop();
  });

  it("TICK auto-transitions from resting to exercising when restSecsLeft reaches 0", () => {
    // Use exercise with restSeconds: 1 so one TICK triggers auto-transition
    const routineOneSecRest: Routine = {
      ...mockRoutine,
      groups: [
        {
          id: "g-1",
          name: "Main",
          exercises: [{ ...mockRoutine.groups[0]!.exercises[0]!, restSeconds: 1 }],
        },
      ],
    };
    const actor = makeActor(routineOneSecRest);
    actor.start();
    actor.send({ type: "START" });
    actor.send({ type: "LOG_SET", exerciseIdx: 0, setData: completedSet });
    expect(actor.getSnapshot().matches("active.resting")).toBe(true);
    actor.send({ type: "TICK" }); // restSecsLeft goes from 1 → 0 → transition
    expect(actor.getSnapshot().matches("active.exercising")).toBe(true);
    actor.stop();
  });

  it("END_WORKOUT transitions to active.confirming", () => {
    const actor = makeActor();
    actor.start();
    actor.send({ type: "START" });
    actor.send({ type: "END_WORKOUT" });
    expect(actor.getSnapshot().matches("active.confirming")).toBe(true);
    actor.stop();
  });

  it("KEEP_GOING from confirming returns to active.exercising", () => {
    const actor = makeActor();
    actor.start();
    actor.send({ type: "START" });
    actor.send({ type: "END_WORKOUT" });
    actor.send({ type: "KEEP_GOING" });
    expect(actor.getSnapshot().matches("active.exercising")).toBe(true);
    actor.stop();
  });

  it("DISCARD from confirming returns to idle and resets context", () => {
    const actor = makeActor(mockRoutine);
    actor.start();
    actor.send({ type: "START" });
    actor.send({ type: "TICK" });
    actor.send({ type: "END_WORKOUT" });
    actor.send({ type: "DISCARD" });
    const snap = actor.getSnapshot();
    expect(snap.value).toBe("idle");
    expect(snap.context.elapsedSecs).toBe(0);
    expect(snap.context.exercises).toHaveLength(0);
    actor.stop();
  });

  it("CONFIRM_FINISH transitions to finishing and then done on success", async () => {
    const successRuntime = {
      runPromise: vi.fn().mockResolvedValue([]),
    } as unknown as JournalRuntime;

    const actor = createActor(workoutSessionMachine, {
      input: { routine: null, settings: mockSettings, runtime: successRuntime },
    });
    actor.start();
    actor.send({ type: "START" });
    actor.send({ type: "END_WORKOUT" });
    actor.send({ type: "CONFIRM_FINISH" });

    // Wait for the async actor to resolve
    await new Promise<void>((resolve) => {
      const sub = actor.subscribe((snap) => {
        if (snap.value === "done" || snap.value === "error") {
          sub.unsubscribe();
          resolve();
        }
      });
    });

    expect(actor.getSnapshot().value).toBe("done");
    actor.stop();
  });

  it("CONFIRM_FINISH transitions to error on failure", async () => {
    const failRuntime = {
      runPromise: vi.fn().mockRejectedValue(new Error("DB error")),
    } as unknown as JournalRuntime;

    const actor = createActor(workoutSessionMachine, {
      input: { routine: null, settings: mockSettings, runtime: failRuntime },
    });
    actor.start();
    actor.send({ type: "START" });
    actor.send({ type: "END_WORKOUT" });
    actor.send({ type: "CONFIRM_FINISH" });

    await new Promise<void>((resolve) => {
      const sub = actor.subscribe((snap) => {
        if (snap.value === "done" || snap.value === "error") {
          sub.unsubscribe();
          resolve();
        }
      });
    });

    expect(actor.getSnapshot().value).toBe("error");
    actor.stop();
  });

  it("LOG_SET appends the set data to the exercise", () => {
    const actor = makeActor(mockRoutineNoRest);
    actor.start();
    actor.send({ type: "START" });
    actor.send({ type: "LOG_SET", exerciseIdx: 0, setData: completedSet });
    const snap = actor.getSnapshot();
    expect(snap.context.exercises[0]?.sets).toHaveLength(1);
    expect(snap.context.exercises[0]?.sets[0]).toEqual(completedSet);
    actor.stop();
  });
});
