import { createMachine, assign, fromPromise } from "xstate";
import { Schema } from "effect";
import type { Routine } from "@/lib/journal/routine-store";
import type { AppSettings } from "@/contexts/settings/application";
import type { JournalRuntime } from "@/lib/journal/runtime";
import type { ActiveExercise, CompletedSet } from "@/contexts/journal/domain/typed-payloads";
import { appendEntries } from "@/lib/journal/journal-store";
import { IsoTimestamp, EntryName } from "@/contexts/journal/domain/schema";

// ---------------------------------------------------------------------------
// resolvedRest — determine rest duration for an exercise + settings combo
// ---------------------------------------------------------------------------

export function resolvedRest(exercise: ActiveExercise, settings: AppSettings): number {
  if (exercise.restSeconds !== null) {
    return exercise.restSeconds;
  }
  if (settings.restSeconds === "reps") {
    return exercise.targetReps;
  }
  if (settings.restSeconds === "reps2") {
    return exercise.targetReps * 2;
  }
  if (settings.restSeconds === 0) {
    return 0;
  }
  // numeric 30 | 60 | 90
  return settings.restSeconds as number;
}

// ---------------------------------------------------------------------------
// buildWorkoutEntry — construct a NewEntryInput from machine context
// ---------------------------------------------------------------------------

export function buildWorkoutEntry(context: WorkoutMachineContext) {
  const nowMs = Date.now();
  const startMs = nowMs - context.elapsedSecs * 1000;
  return {
    name: Schema.decodeUnknownSync(EntryName)("workout"),
    startedAt: Schema.decodeUnknownSync(IsoTimestamp)(new Date(startMs).toISOString()),
    finishedAt: Schema.decodeUnknownSync(IsoTimestamp)(new Date(nowMs).toISOString()),
    labels: [] as string[],
    payload: {
      routineName: context.routine?.name ?? null,
      durationSecs: context.elapsedSecs,
      exercises: context.exercises.map((ex) => ({ ...ex, name: ex.name })),
    },
  };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WorkoutMachineContext {
  routine: Routine | null;
  exercises: ActiveExercise[];
  currentExIdx: number;
  currentSetIdx: number;
  elapsedSecs: number;
  restSecsLeft: number;
  settings: AppSettings;
  runtime: JournalRuntime;
  error: unknown | null;
}

interface WorkoutMachineInput {
  routine: Routine | null;
  settings: AppSettings;
  runtime: JournalRuntime;
}

type WorkoutMachineEvent =
  | { type: "START" }
  | { type: "TICK" }
  | { type: "LOG_SET"; exerciseIdx: number; setData: CompletedSet }
  | { type: "SKIP_REST" }
  | { type: "END_WORKOUT" }
  | { type: "KEEP_GOING" }
  | { type: "CONFIRM_FINISH" }
  | { type: "DISCARD" }
  | { type: "RETRY" };

// ---------------------------------------------------------------------------
// Machine
// ---------------------------------------------------------------------------

export const workoutSessionMachine = createMachine(
  {
    id: "workoutSessionMachine",
    types: {} as {
      context: WorkoutMachineContext;
      events: WorkoutMachineEvent;
      input: WorkoutMachineInput;
    },
    context: ({ input }) => ({
      routine: input.routine,
      exercises: [],
      currentExIdx: 0,
      currentSetIdx: 0,
      elapsedSecs: 0,
      restSecsLeft: 0,
      settings: input.settings,
      runtime: input.runtime,
      error: null,
    }),
    initial: "idle",
    states: {
      idle: {
        on: {
          START: {
            target: "active.exercising",
            actions: assign({
              exercises: ({ context }) =>
                context.routine
                  ? context.routine.groups.flatMap((g) =>
                      g.exercises.map((ex) => ({ ...ex, sets: [] as CompletedSet[] })),
                    )
                  : [],
            }),
          },
        },
      },
      active: {
        type: "compound",
        initial: "exercising",
        states: {
          exercising: {
            on: {
              TICK: {
                actions: assign({
                  elapsedSecs: ({ context }) => context.elapsedSecs + 1,
                }),
              },
              LOG_SET: [
                {
                  guard: ({ context, event }) => {
                    const ex = context.exercises[event.exerciseIdx];
                    if (!ex) return false;
                    return resolvedRest(ex, context.settings) > 0;
                  },
                  target: "resting",
                  actions: assign({
                    exercises: ({ context, event }) => {
                      const next = [...context.exercises];
                      const ex = next[event.exerciseIdx];
                      if (!ex) return next;
                      next[event.exerciseIdx] = {
                        ...ex,
                        sets: [...ex.sets, event.setData],
                      };
                      return next;
                    },
                    currentExIdx: ({ event }) => event.exerciseIdx,
                    restSecsLeft: ({ context, event }) => {
                      const ex = context.exercises[event.exerciseIdx];
                      if (!ex) return 0;
                      return resolvedRest(ex, context.settings);
                    },
                  }),
                },
                {
                  target: "exercising",
                  actions: assign({
                    exercises: ({ context, event }) => {
                      const next = [...context.exercises];
                      const ex = next[event.exerciseIdx];
                      if (!ex) return next;
                      next[event.exerciseIdx] = {
                        ...ex,
                        sets: [...ex.sets, event.setData],
                      };
                      return next;
                    },
                    currentExIdx: ({ event }) => event.exerciseIdx,
                  }),
                },
              ],
              END_WORKOUT: {
                target: "confirming",
              },
            },
          },
          resting: {
            on: {
              TICK: [
                {
                  guard: ({ context }) => context.restSecsLeft - 1 <= 0,
                  target: "exercising",
                  actions: assign({
                    elapsedSecs: ({ context }) => context.elapsedSecs + 1,
                    restSecsLeft: 0,
                  }),
                },
                {
                  target: "resting",
                  actions: assign({
                    elapsedSecs: ({ context }) => context.elapsedSecs + 1,
                    restSecsLeft: ({ context }) => context.restSecsLeft - 1,
                  }),
                },
              ],
              SKIP_REST: {
                target: "exercising",
                actions: assign({
                  restSecsLeft: 0,
                }),
              },
              END_WORKOUT: {
                target: "confirming",
              },
            },
          },
          confirming: {
            on: {
              KEEP_GOING: {
                target: "exercising",
              },
              CONFIRM_FINISH: {
                target: "#workoutSessionMachine.finishing",
              },
              DISCARD: {
                target: "#workoutSessionMachine.idle",
                actions: assign({
                  exercises: [],
                  elapsedSecs: 0,
                  restSecsLeft: 0,
                  currentExIdx: 0,
                  currentSetIdx: 0,
                  error: null,
                }),
              },
            },
          },
        },
        on: {
          CONFIRM_FINISH: {
            target: "finishing",
          },
        },
      },
      finishing: {
        invoke: {
          src: "saveWorkout",
          input: ({ context }) => ({ context }),
          onDone: {
            target: "done",
          },
          onError: {
            target: "error",
            actions: assign({ error: ({ event }) => event.error }),
          },
        },
      },
      done: {
        type: "final",
      },
      error: {
        on: {
          RETRY: {
            target: "finishing",
            actions: assign({ error: null }),
          },
        },
      },
    },
  },
  {
    actors: {
      saveWorkout: fromPromise(async ({ input }: { input: { context: WorkoutMachineContext } }) => {
        const entry = buildWorkoutEntry(input.context);
        return input.context.runtime.runPromise(appendEntries([entry]));
      }),
    },
  },
);
