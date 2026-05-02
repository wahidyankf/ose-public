import { Effect, Schema } from "effect";
import { PgliteService } from "./runtime";
import { StorageUnavailable } from "../domain/errors";
import { appendEntries } from "./journal-store";
import { saveRoutine } from "@/lib/journal/routine-store";
import { saveSettings } from "@/contexts/settings/application";
import { IsoTimestamp, EntryName, EntryPayload } from "../domain/schema";
import type { Routine } from "@/lib/journal/routine-store";
import type { ExerciseTemplate } from "../domain/typed-payloads";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTimestamp(offsetDays: number): IsoTimestamp {
  return Schema.decodeUnknownSync(IsoTimestamp)(new Date(Date.now() - offsetDays * 86400 * 1000).toISOString());
}

function makeName(s: string): EntryName {
  return Schema.decodeUnknownSync(EntryName)(s);
}

function makePayload(obj: Record<string, unknown>): EntryPayload {
  return Schema.decodeUnknownSync(EntryPayload)(obj);
}

// ---------------------------------------------------------------------------
// Seed data — routines
// ---------------------------------------------------------------------------

function makeKettlebellRoutine(): Routine {
  const exercises: ExerciseTemplate[] = [
    {
      id: crypto.randomUUID(),
      name: "Turkish Get-Up",
      type: "reps",
      targetSets: 2,
      targetReps: 5,
      targetWeight: "16kg",
      targetDuration: null,
      timerMode: "countdown",
      bilateral: false,
      dayStreak: 0,
      restSeconds: 90,
    },
    {
      id: crypto.randomUUID(),
      name: "Kettlebell Swing",
      type: "reps",
      targetSets: 3,
      targetReps: 20,
      targetWeight: "24kg",
      targetDuration: null,
      timerMode: "countdown",
      bilateral: true,
      dayStreak: 0,
      restSeconds: 60,
    },
    {
      id: crypto.randomUUID(),
      name: "Goblet Squat",
      type: "reps",
      targetSets: 3,
      targetReps: 12,
      targetWeight: "20kg",
      targetDuration: null,
      timerMode: "countdown",
      bilateral: false,
      dayStreak: 0,
      restSeconds: 60,
    },
    {
      id: crypto.randomUUID(),
      name: "Single Arm Press",
      type: "reps",
      targetSets: 3,
      targetReps: 8,
      targetWeight: "16kg",
      targetDuration: null,
      timerMode: "countdown",
      bilateral: true,
      dayStreak: 0,
      restSeconds: 60,
    },
    {
      id: crypto.randomUUID(),
      name: "Windmill",
      type: "reps",
      targetSets: 2,
      targetReps: 5,
      targetWeight: "12kg",
      targetDuration: null,
      timerMode: "countdown",
      bilateral: true,
      dayStreak: 0,
      restSeconds: 90,
    },
    {
      id: crypto.randomUUID(),
      name: "Farmer Walk",
      type: "duration",
      targetSets: 1,
      targetReps: 0,
      targetWeight: null,
      targetDuration: 60,
      timerMode: "countdown",
      bilateral: false,
      dayStreak: 0,
      restSeconds: 90,
    },
  ];

  return {
    id: crypto.randomUUID(),
    name: "Kettlebell day",
    hue: "teal",
    type: "workout",
    createdAt: makeTimestamp(7),
    groups: [{ id: crypto.randomUUID(), name: "Main", exercises }],
  };
}

function makeCalisthenicsRoutine(): Routine {
  const exercises: ExerciseTemplate[] = [
    {
      id: crypto.randomUUID(),
      name: "Pull-Up",
      type: "reps",
      targetSets: 3,
      targetReps: 8,
      targetWeight: null,
      targetDuration: null,
      timerMode: "countdown",
      bilateral: false,
      dayStreak: 0,
      restSeconds: 90,
    },
    {
      id: crypto.randomUUID(),
      name: "Dip",
      type: "reps",
      targetSets: 3,
      targetReps: 12,
      targetWeight: null,
      targetDuration: null,
      timerMode: "countdown",
      bilateral: false,
      dayStreak: 0,
      restSeconds: 60,
    },
    {
      id: crypto.randomUUID(),
      name: "Pistol Squat",
      type: "reps",
      targetSets: 2,
      targetReps: 5,
      targetWeight: null,
      targetDuration: null,
      timerMode: "countdown",
      bilateral: true,
      dayStreak: 0,
      restSeconds: 90,
    },
    {
      id: crypto.randomUUID(),
      name: "L-Sit",
      type: "duration",
      targetSets: 1,
      targetReps: 0,
      targetWeight: null,
      targetDuration: 30,
      timerMode: "countdown",
      bilateral: false,
      dayStreak: 0,
      restSeconds: 60,
    },
    {
      id: crypto.randomUUID(),
      name: "Handstand",
      type: "duration",
      targetSets: 1,
      targetReps: 0,
      targetWeight: null,
      targetDuration: 60,
      timerMode: "countdown",
      bilateral: false,
      dayStreak: 0,
      restSeconds: 90,
    },
  ];

  return {
    id: crypto.randomUUID(),
    name: "Calisthenics",
    hue: "honey",
    type: "workout",
    createdAt: makeTimestamp(6),
    groups: [{ id: crypto.randomUUID(), name: "Future", exercises }],
  };
}

function makeSuperExerciseRoutine(): Routine {
  const exercises: ExerciseTemplate[] = [
    {
      id: crypto.randomUUID(),
      name: "Squat",
      type: "reps",
      targetSets: 5,
      targetReps: 5,
      targetWeight: "80kg",
      targetDuration: null,
      timerMode: "countdown",
      bilateral: false,
      dayStreak: 0,
      restSeconds: 90,
    },
    {
      id: crypto.randomUUID(),
      name: "Deadlift",
      type: "reps",
      targetSets: 1,
      targetReps: 5,
      targetWeight: "100kg",
      targetDuration: null,
      timerMode: "countdown",
      bilateral: false,
      dayStreak: 0,
      restSeconds: 90,
    },
    {
      id: crypto.randomUUID(),
      name: "Bench Press",
      type: "reps",
      targetSets: 5,
      targetReps: 5,
      targetWeight: "60kg",
      targetDuration: null,
      timerMode: "countdown",
      bilateral: false,
      dayStreak: 0,
      restSeconds: 90,
    },
  ];

  return {
    id: crypto.randomUUID(),
    name: "Super Exercise",
    hue: "plum",
    type: "workout",
    createdAt: makeTimestamp(5),
    groups: [{ id: crypto.randomUUID(), name: "Main", exercises }],
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function seedIfEmpty(): Effect.Effect<void, StorageUnavailable, PgliteService> {
  return Effect.gen(function* () {
    const { db } = yield* PgliteService;

    const entriesResult = yield* Effect.tryPromise({
      try: () => db.query<{ count: string }>("SELECT count(*) as count FROM journal_entries"),
      catch: (cause) => new StorageUnavailable({ cause }),
    });

    const routinesResult = yield* Effect.tryPromise({
      try: () => db.query<{ count: string }>("SELECT count(*) as count FROM routines"),
      catch: (cause) => new StorageUnavailable({ cause }),
    });

    const eCount = parseInt(entriesResult.rows[0]?.count ?? "0", 10);
    const rCount = parseInt(routinesResult.rows[0]?.count ?? "0", 10);

    if (eCount > 0 || rCount > 0) return;

    // -------------------------------------------------------------------------
    // Settings
    // -------------------------------------------------------------------------

    yield* saveSettings({ name: "Yoka", restSeconds: 60, darkMode: false, lang: "en" });

    // -------------------------------------------------------------------------
    // Routines
    // -------------------------------------------------------------------------

    yield* saveRoutine(makeKettlebellRoutine());
    yield* saveRoutine(makeCalisthenicsRoutine());
    yield* saveRoutine(makeSuperExerciseRoutine());

    // -------------------------------------------------------------------------
    // Journal entries (one per kind, spread across last 7 days)
    // -------------------------------------------------------------------------

    yield* Effect.mapError(
      appendEntries([
        // Day 0 — workout
        {
          name: makeName("workout"),
          payload: makePayload({
            routineName: "Kettlebell day",
            durationSecs: 2400,
            exercises: [],
          }),
          startedAt: makeTimestamp(0),
          finishedAt: makeTimestamp(0),
          labels: [],
        },
        // Day 1 — reading
        {
          name: makeName("reading"),
          payload: makePayload({
            title: "Atomic Habits",
            author: "James Clear",
            pages: 320,
            durationMins: 45,
            completionPct: 30,
            notes: "Great chapter on habit loops",
          }),
          startedAt: makeTimestamp(1),
          finishedAt: makeTimestamp(1),
          labels: [],
        },
        // Day 2 — learning
        {
          name: makeName("learning"),
          payload: makePayload({
            subject: "XState v5",
            source: "Official docs",
            durationMins: 60,
            rating: 4,
            notes: "Parallel states are powerful",
          }),
          startedAt: makeTimestamp(2),
          finishedAt: makeTimestamp(2),
          labels: [],
        },
        // Day 3 — meal
        {
          name: makeName("meal"),
          payload: makePayload({
            name: "Nasi Goreng",
            mealType: "lunch",
            energyLevel: 4,
            notes: null,
          }),
          startedAt: makeTimestamp(3),
          finishedAt: makeTimestamp(3),
          labels: [],
        },
        // Day 4 — focus
        {
          name: makeName("focus"),
          payload: makePayload({
            task: "Write tests for journal-store",
            durationMins: 90,
            quality: 5,
            notes: null,
          }),
          startedAt: makeTimestamp(4),
          finishedAt: makeTimestamp(4),
          labels: [],
        },
        // Day 5 — custom (Meditation)
        {
          name: makeName("custom-meditation"),
          payload: makePayload({
            name: "Meditation",
            hue: "plum",
            icon: "timer",
            durationMins: 20,
            notes: "Morning session",
          }),
          startedAt: makeTimestamp(5),
          finishedAt: makeTimestamp(5),
          labels: [],
        },
      ]),
      (storeError) => {
        if (storeError._tag === "StorageUnavailable") return storeError;
        return new StorageUnavailable({ cause: storeError });
      },
    );
  });
}
