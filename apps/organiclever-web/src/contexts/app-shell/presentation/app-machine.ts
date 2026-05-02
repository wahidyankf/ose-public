import { createMachine, assign } from "xstate";

export type ActiveLoggerKind = "reading" | "learning" | "meal" | "focus";

/** Summary of a finished workout session passed to FinishScreen. */
export interface CompletedSession {
  durationSecs: number;
  exercises: Array<{ name: string; sets: number }>;
  routineName: string | null;
}

interface AppMachineContext {
  isDesktop: boolean;
  darkMode: boolean;
  loggerKind: ActiveLoggerKind | null;
  customLoggerName: string | null;
}

interface AppMachineInput {
  initialDarkMode: boolean;
  /** Retained for backwards compatibility with older callers; ignored. */
  initialTab?: string;
}

type AppMachineEvent =
  | { type: "OPEN_ADD_ENTRY" }
  | { type: "CLOSE_ADD_ENTRY" }
  | { type: "OPEN_LOGGER"; kind: ActiveLoggerKind }
  | { type: "CLOSE_LOGGER" }
  | { type: "OPEN_CUSTOM_LOGGER"; name: string }
  | { type: "CLOSE_CUSTOM_LOGGER" }
  | { type: "TOGGLE_DARK_MODE" }
  | { type: "SET_DESKTOP"; isDesktop: boolean };

/**
 * Trimmed appMachine — overlay region only. Navigation moved to URL-routed
 * pages under /app/. The machine retains darkMode and isDesktop in context
 * since both are presentation-level state with no URL representation.
 */
export const appMachine = createMachine({
  id: "appMachine",
  types: {} as {
    context: AppMachineContext;
    events: AppMachineEvent;
    input: AppMachineInput;
  },
  context: ({ input }) => ({
    isDesktop: false,
    darkMode: input.initialDarkMode,
    loggerKind: null,
    customLoggerName: null,
  }),
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
    TOGGLE_DARK_MODE: {
      actions: assign({ darkMode: ({ context }) => !context.darkMode }),
    },
    SET_DESKTOP: {
      actions: assign({ isDesktop: ({ event }) => event.isDesktop }),
    },
  },
});
