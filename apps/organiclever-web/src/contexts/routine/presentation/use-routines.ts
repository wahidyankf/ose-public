import { useState, useEffect, useCallback } from "react";
import type { JournalRuntime } from "@/contexts/journal/application";
import { listRoutines, saveRoutine, deleteRoutine, reorderRoutineExercises } from "../application";
import type { Routine } from "../domain";

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

export type RoutinesState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; routines: ReadonlyArray<Routine> }
  | { status: "error"; error: unknown };

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useRoutines(runtime: JournalRuntime) {
  const [state, setState] = useState<RoutinesState>({ status: "idle" });

  const load = useCallback(() => {
    setState({ status: "loading" });
    runtime.runPromise(listRoutines()).then(
      (routines) => setState({ status: "ready", routines }),
      (error) => setState({ status: "error", error }),
    );
  }, [runtime]);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(
    (r: Routine) => {
      return runtime.runPromise(saveRoutine(r)).then(() => load());
    },
    [runtime, load],
  );

  const remove = useCallback(
    (id: string) => {
      return runtime.runPromise(deleteRoutine(id)).then(() => load());
    },
    [runtime, load],
  );

  const reorder = useCallback(
    (routineId: string, groupId: string, from: number, to: number) => {
      return runtime.runPromise(reorderRoutineExercises(routineId, groupId, from, to)).then(() => load());
    },
    [runtime, load],
  );

  return { state, save, remove, reorder, reload: load };
}
