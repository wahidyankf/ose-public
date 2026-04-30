import { assign, createMachine, fromPromise } from "xstate";
import { Cause, Option, Runtime } from "effect";
import type { JournalRuntime } from "./runtime";
import { appendEntries, listEntries, updateEntry, deleteEntry, bumpEntry, clearEntries } from "./journal-store";
import type { JournalEntry, NewEntryInput, UpdateEntryInput } from "./schema";
import type { EntryId } from "./schema";
import type { StoreError } from "./errors";

/**
 * Extracts the typed StoreError from a FiberFailure thrown by Effect's runPromise.
 * Effect's runPromise rejects with a FiberFailure wrapping the Cause; we need to
 * unwrap to get the typed error for display in the UI.
 */
function extractStoreError(raw: unknown): StoreError {
  if (Runtime.isFiberFailure(raw)) {
    const cause = raw[Runtime.FiberFailureCauseId] as Cause.Cause<StoreError>;
    const option = Cause.failureOption(cause);
    if (Option.isSome(option)) {
      return option.value;
    }
  }
  return raw as StoreError;
}

export type JournalContext = {
  entries: ReadonlyArray<JournalEntry>;
  error: StoreError | null;
  runtime: JournalRuntime;
};

export type JournalEvent =
  | { type: "ADD_BATCH"; inputs: ReadonlyArray<NewEntryInput> }
  | { type: "UPDATE"; id: EntryId; input: UpdateEntryInput }
  | { type: "DELETE"; id: EntryId }
  | { type: "BUMP"; id: EntryId }
  | { type: "CLEAR" }
  | { type: "RETRY" };

type LoadEntriesInput = { runtime: JournalRuntime };
type PerformMutationInput = { runtime: JournalRuntime; event: JournalEvent };

export const journalMachine = createMachine(
  {
    types: {} as {
      context: JournalContext;
      events: JournalEvent;
      input: { runtime: JournalRuntime };
    },
    id: "journal",
    initial: "initializing",
    context: ({ input }: { input: { runtime: JournalRuntime } }) => ({
      entries: [],
      error: null,
      runtime: input.runtime,
    }),
    states: {
      initializing: {
        invoke: {
          src: "loadEntries",
          input: ({ context }: { context: JournalContext }): LoadEntriesInput => ({
            runtime: context.runtime,
          }),
          onDone: {
            target: "ready",
            actions: assign(({ event }) => ({
              entries: (event as { output: ReadonlyArray<JournalEntry> }).output,
              error: null as StoreError | null,
            })),
          },
          onError: {
            target: "error",
            actions: assign(({ event }) => ({
              error: extractStoreError((event as { error: unknown }).error),
            })),
          },
        },
      },
      ready: {
        initial: "idle",
        states: {
          idle: {
            on: {
              ADD_BATCH: { target: "mutating" },
              UPDATE: { target: "mutating" },
              DELETE: { target: "mutating" },
              BUMP: { target: "mutating" },
              CLEAR: { target: "mutating" },
            },
          },
          mutating: {
            invoke: {
              src: "performMutation",
              input: ({ context, event }: { context: JournalContext; event: JournalEvent }): PerformMutationInput => ({
                runtime: context.runtime,
                event,
              }),
              onDone: {
                target: "reloading",
              },
              onError: {
                target: "idle",
                actions: assign(({ event }) => ({
                  error: extractStoreError((event as { error: unknown }).error),
                })),
              },
            },
          },
          reloading: {
            invoke: {
              src: "loadEntries",
              input: ({ context }: { context: JournalContext }): LoadEntriesInput => ({
                runtime: context.runtime,
              }),
              onDone: {
                target: "idle",
                actions: assign(({ event }) => ({
                  entries: (event as { output: ReadonlyArray<JournalEntry> }).output,
                  error: null as StoreError | null,
                })),
              },
              onError: {
                target: "idle",
                actions: assign(({ event }) => ({
                  error: extractStoreError((event as { error: unknown }).error),
                })),
              },
            },
          },
        },
      },
      error: {
        on: {
          RETRY: { target: "initializing" },
        },
      },
    },
  },
  {
    actors: {
      loadEntries: fromPromise(async ({ input }: { input: LoadEntriesInput }): Promise<ReadonlyArray<JournalEntry>> => {
        return input.runtime.runPromise(listEntries());
      }),
      performMutation: fromPromise(async ({ input }: { input: PerformMutationInput }): Promise<void> => {
        const { runtime, event } = input;
        switch (event.type) {
          case "ADD_BATCH":
            await runtime.runPromise(appendEntries(event.inputs));
            break;
          case "UPDATE":
            await runtime.runPromise(updateEntry(event.id, event.input));
            break;
          case "DELETE":
            await runtime.runPromise(deleteEntry(event.id));
            break;
          case "BUMP":
            await runtime.runPromise(bumpEntry(event.id));
            break;
          case "CLEAR":
            await runtime.runPromise(clearEntries());
            break;
        }
      }),
    },
  },
);
