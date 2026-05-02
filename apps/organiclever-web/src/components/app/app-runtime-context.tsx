"use client";

import { createContext, useContext } from "react";
import type { Actor } from "xstate";
import type { JournalRuntime } from "@/contexts/journal/application";
import type { appMachine } from "@/lib/app/app-machine";
import type { Routine } from "@/lib/journal/routine-store";
import type { CompletedSession } from "@/lib/app/app-machine";

type AppMachineActor = Actor<typeof appMachine>;
type AppMachineState = ReturnType<AppMachineActor["getSnapshot"]>;
type AppMachineSend = AppMachineActor["send"];

export interface AppRuntimeContextValue {
  runtime: JournalRuntime;
  state: AppMachineState;
  send: AppMachineSend;
  /** Bumped after a logger save to force HomeScreen to reload data. */
  refreshKey: number;
  refreshHome: () => void;
  /** Convenience callback for both chromes to open the AddEntry sheet. */
  openAddEntry: () => void;
  /** Routine being started (set by Home before pushing /app/workout). */
  activeRoutine: Routine | null;
  setActiveRoutine: (routine: Routine | null) => void;
  /** Routine being edited (set by Home before pushing /app/routines/edit). */
  editingRoutine: Routine | null;
  setEditingRoutine: (routine: Routine | null) => void;
  /** Latest completed session (set by Workout before pushing /app/workout/finish). */
  completedSession: CompletedSession | null;
  setCompletedSession: (session: CompletedSession | null) => void;
}

const AppRuntimeContext = createContext<AppRuntimeContextValue | null>(null);

export interface AppRuntimeProviderProps {
  value: AppRuntimeContextValue;
  children: React.ReactNode;
}

export function AppRuntimeProvider({ value, children }: AppRuntimeProviderProps) {
  return <AppRuntimeContext.Provider value={value}>{children}</AppRuntimeContext.Provider>;
}

export function useAppRuntime(): AppRuntimeContextValue {
  const ctx = useContext(AppRuntimeContext);
  if (!ctx) {
    throw new Error("useAppRuntime must be called inside <AppRuntimeProvider>");
  }
  return ctx;
}
