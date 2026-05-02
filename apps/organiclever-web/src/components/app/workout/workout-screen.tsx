"use client";

import { useEffect, useRef, useState } from "react";
import { useActor } from "@xstate/react";
import { AppHeader, Button, Icon } from "@open-sharia-enterprise/ts-ui";
import { workoutSessionMachine, resolvedRest } from "@/lib/workout/workout-machine";
import type { Routine } from "@/lib/journal/routine-store";
import type { AppSettings } from "@/contexts/settings/application";
import type { JournalRuntime } from "@/contexts/journal/infrastructure/runtime";
import type { CompletedSession } from "@/lib/app/app-machine";
import type { CompletedSet } from "@/contexts/journal/domain/typed-payloads";
import { fmtTime } from "@/lib/utils/fmt";
import { ActiveExerciseRow } from "./active-exercise-row";
import { RestTimer } from "./rest-timer";
import { EndWorkoutSheet } from "./end-workout-sheet";
import { SetEditSheet } from "./set-edit-sheet";
import { SetTimerSheet } from "./set-timer-sheet";

export interface WorkoutScreenProps {
  routine: Routine | null;
  settings: AppSettings;
  runtime: JournalRuntime;
  onFinishWorkout: (session: CompletedSession) => void;
  /** Called when DISCARD is confirmed — navigates back to main screen. */
  onBack: () => void; // reserved for future direct-back flow
}

interface EditingSet {
  exerciseIdx: number;
  setIdx: number;
}

interface TimerSet {
  exerciseIdx: number;
  setIdx: number;
}

/**
 * Builds a CompletedSession summary from the machine context for the
 * /app/workout/finish route wrapper.
 */
function buildCompletedSession(context: {
  elapsedSecs: number;
  exercises: ReadonlyArray<{ name: string; sets: ReadonlyArray<CompletedSet> }>;
  routine: Routine | null;
}): CompletedSession {
  return {
    durationSecs: context.elapsedSecs,
    exercises: context.exercises.map((ex) => ({ name: ex.name, sets: ex.sets.length })),
    routineName: context.routine?.name ?? null,
  };
}

/**
 * Active workout screen. Driven entirely by workoutSessionMachine.
 *
 * Key behaviors:
 * - Mounts workoutSessionMachine with routine + settings + runtime
 * - Auto-sends START on mount
 * - setInterval in useRef sends TICK every second while state is active
 * - AppHeader with back button → END_WORKOUT + elapsed timer in subtitle
 * - Renders ActiveExerciseRow list
 * - RestTimer banner when state.matches('active.resting')
 * - EndWorkoutSheet when state.matches('active.confirming')
 * - Calls onFinishWorkout when state.matches('done')
 */
export function WorkoutScreen({ routine, settings, runtime, onFinishWorkout, onBack: _onBack }: WorkoutScreenProps) {
  const [state, send] = useActor(workoutSessionMachine, {
    input: { routine, settings, runtime },
  });

  const [editingSet, setEditingSet] = useState<EditingSet | null>(null);
  const [timerSet, setTimerSet] = useState<TimerSet | null>(null);
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasCalledFinish = useRef(false);

  // Auto-start the workout on mount
  useEffect(() => {
    send({ type: "START" });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // setInterval for TICK — only fires while in an active sub-state
  useEffect(() => {
    const isActive =
      state.matches("active.exercising") || state.matches("active.resting") || state.matches("active.confirming");
    if (isActive) {
      tickIntervalRef.current = setInterval(() => send({ type: "TICK" }), 1000);
      return () => {
        if (tickIntervalRef.current !== null) {
          clearInterval(tickIntervalRef.current);
        }
      };
    }
    return undefined;
  }, [state.value, send]);

  // When machine reaches 'done', call onFinishWorkout exactly once
  useEffect(() => {
    if (state.matches("done") && !hasCalledFinish.current) {
      hasCalledFinish.current = true;
      onFinishWorkout(buildCompletedSession(state.context));
    }
  }, [state.value, state.context, onFinishWorkout]);

  const { exercises, elapsedSecs, restSecsLeft, currentExIdx } = state.context;

  const isExercising = state.matches("active.exercising");
  const isResting = state.matches("active.resting");
  const isConfirming = state.matches("active.confirming");
  const isFinishing = state.matches("finishing");
  const isError = state.matches("error");

  const totalSets = exercises.reduce((n, e) => n + e.targetSets, 0);
  const doneSets = exercises.reduce((n, e) => n + e.sets.length, 0);
  const pct = totalSets > 0 ? (doneSets / totalSets) * 100 : 0;

  // Find index of first exercise not yet fully done
  const nextUpIdx = exercises.findIndex((e) => e.sets.length < e.targetSets);

  function handleLogSet(exerciseIdx: number, setData: CompletedSet) {
    send({ type: "LOG_SET", exerciseIdx, setData });
  }

  function handleEditSetSave(exerciseIdx: number, setIdx: number, data: { reps: number; weight: string }) {
    // Directly update sets in exercises without a machine event (local edit)
    // We replicate the exercise array update via a LOG_SET re-use workaround:
    // The simplest approach is to update the exercises in context via a machine
    // event. Since the machine doesn't have an EDIT_SET event, we derive the
    // CompletedSet from the data and handle via the existing exercises array.
    //
    // For Phase 4, edit is handled by a re-log: we reset the set by removing
    // and re-adding. Since LOG_SET always appends, we use a direct context
    // manipulation pattern supported by XState v5's assign in the machine.
    //
    // The simplest compliant implementation: use LOG_SET to overwrite
    // the set. This appends a new set which isn't correct for editing.
    // Instead, we store edited data in local state and pass it up via
    // a callback that modifies the exercises array in a shadow state.
    //
    // Per Phase 4 spec: SetEditSheet calls onSave → this handler updates
    // the exercise's set at the given index. Since workoutSessionMachine
    // doesn't have an EDIT_SET event (not in spec), we use a local override
    // array tracked via useState.
    //
    // Note: The machine's exercises are the source of truth; however since
    // XState v5 context is immutable from outside, we apply a local edit
    // override stored in component state and merged at render time.
    setEditedSets((prev) => {
      const key = `${exerciseIdx}:${setIdx}`;
      return new Map(prev).set(key, {
        reps: data.reps,
        weight: data.weight || null,
        duration: null,
        restTaken: null,
      });
    });
    setEditingSet(null);
  }

  // Local override map for edited sets: `exerciseIdx:setIdx` → CompletedSet
  const [editedSets, setEditedSets] = useState<Map<string, CompletedSet>>(new Map());

  // Merge machine exercises with local edits for display
  const displayExercises = exercises.map((ex, exIdx) => ({
    ...ex,
    sets: ex.sets.map((s, sIdx) => {
      const override = editedSets.get(`${exIdx}:${sIdx}`);
      return override ?? s;
    }),
  }));

  // Error state
  if (isError) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: 24,
        }}
      >
        <p style={{ color: "var(--color-destructive)", fontWeight: 600 }}>Failed to save workout. Please try again.</p>
        <Button variant="teal" onClick={() => send({ type: "RETRY" })}>
          Retry
        </Button>
      </div>
    );
  }

  // Saving state
  if (isFinishing) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-muted-foreground)",
        }}
      >
        Saving workout…
      </div>
    );
  }

  // Determine rest info for RestTimer
  const restingExercise = isResting ? displayExercises[currentExIdx] : null;
  const totalRest = restingExercise ? resolvedRest(exercises[currentExIdx] ?? restingExercise, settings) : 0;

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <AppHeader
        title={routine?.name ?? "Quick workout"}
        subtitle={`${doneSets}/${totalSets} sets · ${fmtTime(elapsedSecs)}`}
        onBack={() => send({ type: "END_WORKOUT" })}
        trailing={
          <button
            type="button"
            onClick={() => send({ type: "END_WORKOUT" })}
            style={{
              minHeight: 36,
              padding: "0 12px",
              borderRadius: 10,
              border: "1px solid var(--color-border)",
              background: "var(--color-card)",
              fontFamily: "inherit",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              color: "var(--color-muted-foreground)",
            }}
          >
            End
          </button>
        }
      />

      {/* Overall progress bar */}
      <div style={{ padding: "0 20px 2px" }}>
        <div
          style={{
            height: 6,
            background: "var(--warm-100)",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              background: "var(--hue-teal)",
              borderRadius: 3,
              transition: "width 300ms",
            }}
          />
        </div>
      </div>

      {/* Scrollable exercise list */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px 20px",
          paddingBottom: isResting ? "110px" : "20px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {displayExercises.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 0",
              color: "var(--color-muted-foreground)",
            }}
          >
            <span style={{ opacity: 0.2, marginBottom: 12, display: "block" }}>
              <Icon name="dumbbell" size={40} />
            </span>
            <div style={{ fontSize: 15, fontWeight: 600 }}>No exercises yet</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>No routine was selected. Finish to save a blank session.</div>
          </div>
        ) : (
          displayExercises.map((ex, idx) => (
            <ActiveExerciseRow
              key={ex.id ?? idx}
              exercise={ex}
              isActive={idx === nextUpIdx && (isExercising || isConfirming)}
              onLogSet={(setData) => handleLogSet(idx, setData)}
              onEditSet={(setIdx) => setEditingSet({ exerciseIdx: idx, setIdx })}
              onStartTimer={(setIdx) => setTimerSet({ exerciseIdx: idx, setIdx })}
              onMoveUp={idx > 0 ? undefined : undefined}
              onMoveDown={idx < displayExercises.length - 1 ? undefined : undefined}
            />
          ))
        )}

        {/* Finish workout button */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
          <Button
            variant="teal"
            size="xl"
            style={{ width: "100%" }}
            onClick={() => send({ type: "END_WORKOUT" })}
            disabled={doneSets === 0}
          >
            <Icon name="check" size={20} />
            Finish workout
          </Button>
        </div>
      </div>

      {/* Rest timer banner (sticky bottom) */}
      {isResting && (
        <RestTimer restSecsLeft={restSecsLeft} totalRest={totalRest} onSkip={() => send({ type: "SKIP_REST" })} />
      )}

      {/* End workout sheet */}
      <EndWorkoutSheet
        isOpen={isConfirming}
        elapsedSecs={elapsedSecs}
        onConfirm={() => send({ type: "CONFIRM_FINISH" })}
        onKeepGoing={() => send({ type: "KEEP_GOING" })}
        onDiscard={() => send({ type: "DISCARD" })}
      />

      {/* Set edit sheet */}
      {editingSet &&
        (() => {
          const { exerciseIdx, setIdx } = editingSet;
          const ex = displayExercises[exerciseIdx];
          const set = ex?.sets[setIdx];
          if (!ex) return null;
          return (
            <SetEditSheet
              isOpen
              setIndex={setIdx}
              exerciseName={ex.name}
              defaultReps={set?.reps ?? ex.targetReps}
              defaultWeight={set?.weight ?? ex.targetWeight ?? ""}
              onSave={(data) => handleEditSetSave(exerciseIdx, setIdx, data)}
              onClose={() => setEditingSet(null)}
            />
          );
        })()}

      {/* Set timer sheet (duration exercises) */}
      {timerSet &&
        (() => {
          const { exerciseIdx, setIdx } = timerSet;
          const ex = displayExercises[exerciseIdx];
          if (!ex) return null;
          return (
            <SetTimerSheet
              setIndex={setIdx + 1}
              totalSets={ex.targetSets}
              exerciseName={ex.name}
              targetDuration={ex.targetDuration}
              timerMode={ex.timerMode}
              onComplete={(data) => {
                handleLogSet(exerciseIdx, {
                  reps: null,
                  weight: null,
                  duration: data.duration,
                  restTaken: null,
                });
                setTimerSet(null);
              }}
              onClose={() => setTimerSet(null)}
            />
          );
        })()}
    </div>
  );
}
