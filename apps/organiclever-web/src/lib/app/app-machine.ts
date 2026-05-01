import { createMachine, assign } from "xstate";
import type { Routine } from "@/lib/journal/routine-store";

export type Tab = "home" | "history" | "progress" | "settings";
export type ActiveLoggerKind = "reading" | "learning" | "meal" | "focus";

/** Summary of a finished workout session passed from WorkoutScreen → FinishScreen. */
export interface CompletedSession {
  durationSecs: number;
  exercises: Array<{ name: string; sets: number }>;
  routineName: string | null;
}

interface AppMachineContext {
  tab: Tab;
  isDesktop: boolean;
  darkMode: boolean;
  routine: Routine | null;
  completedSession: CompletedSession | null;
  loggerKind: ActiveLoggerKind | null;
  customLoggerName: string | null;
}

interface AppMachineInput {
  initialDarkMode: boolean;
  initialTab: Tab;
}

type AppMachineEvent =
  | { type: "NAVIGATE_TAB"; tab: Tab }
  | { type: "START_WORKOUT"; routine?: Routine }
  | { type: "EDIT_ROUTINE"; routine?: Routine }
  | { type: "FINISH_WORKOUT"; session: CompletedSession }
  | { type: "BACK_TO_MAIN" }
  | { type: "OPEN_ADD_ENTRY" }
  | { type: "CLOSE_ADD_ENTRY" }
  | { type: "OPEN_LOGGER"; kind: ActiveLoggerKind }
  | { type: "CLOSE_LOGGER" }
  | { type: "OPEN_CUSTOM_LOGGER"; name: string }
  | { type: "CLOSE_CUSTOM_LOGGER" }
  | { type: "TOGGLE_DARK_MODE" }
  | { type: "SET_DESKTOP"; isDesktop: boolean };

export const appMachine = createMachine({
  id: "appMachine",
  types: {} as {
    context: AppMachineContext;
    events: AppMachineEvent;
    input: AppMachineInput;
  },
  context: ({ input }) => ({
    tab: input.initialTab,
    isDesktop: false,
    darkMode: input.initialDarkMode,
    routine: null,
    completedSession: null,
    loggerKind: null,
    customLoggerName: null,
  }),
  type: "parallel",
  states: {
    navigation: {
      initial: "main",
      states: {
        main: {
          on: {
            START_WORKOUT: {
              target: "workout",
              actions: assign({ routine: ({ event }) => event.routine ?? null }),
            },
            EDIT_ROUTINE: {
              target: "editRoutine",
              actions: assign({ routine: ({ event }) => event.routine ?? null }),
            },
          },
        },
        workout: {
          on: {
            FINISH_WORKOUT: {
              target: "finish",
              actions: assign({ completedSession: ({ event }) => event.session }),
            },
            BACK_TO_MAIN: {
              target: "main",
              actions: assign({ routine: null, completedSession: null }),
            },
          },
        },
        finish: {
          on: {
            BACK_TO_MAIN: {
              target: "main",
              actions: assign({ routine: null, completedSession: null }),
            },
          },
        },
        editRoutine: {
          on: {
            BACK_TO_MAIN: {
              target: "main",
              actions: assign({ routine: null }),
            },
          },
        },
      },
      on: {
        NAVIGATE_TAB: {
          actions: assign({ tab: ({ event }) => event.tab }),
        },
        TOGGLE_DARK_MODE: {
          actions: assign({ darkMode: ({ context }) => !context.darkMode }),
        },
        SET_DESKTOP: {
          actions: assign({ isDesktop: ({ event }) => event.isDesktop }),
        },
      },
    },
    overlay: {
      initial: "none",
      states: {
        none: {
          on: {
            OPEN_ADD_ENTRY: "addEntry",
            OPEN_LOGGER: {
              target: "loggerOpen",
              actions: assign({ loggerKind: ({ event }) => event.kind }),
            },
            OPEN_CUSTOM_LOGGER: {
              target: "customLoggerOpen",
              actions: assign({ customLoggerName: ({ event }) => event.name }),
            },
          },
        },
        addEntry: {
          on: {
            CLOSE_ADD_ENTRY: "none",
            OPEN_LOGGER: {
              target: "loggerOpen",
              actions: assign({ loggerKind: ({ event }) => event.kind }),
            },
            OPEN_CUSTOM_LOGGER: {
              target: "customLoggerOpen",
              actions: assign({ customLoggerName: ({ event }) => event.name }),
            },
          },
        },
        loggerOpen: {
          on: {
            CLOSE_LOGGER: {
              target: "none",
              actions: assign({ loggerKind: null }),
            },
          },
        },
        customLoggerOpen: {
          on: {
            CLOSE_CUSTOM_LOGGER: {
              target: "none",
              actions: assign({ customLoggerName: null }),
            },
          },
        },
      },
      on: {
        // Any BACK_TO_MAIN event resets overlay → none regardless of nav state
        BACK_TO_MAIN: {
          target: ".none",
        },
      },
    },
  },
});
