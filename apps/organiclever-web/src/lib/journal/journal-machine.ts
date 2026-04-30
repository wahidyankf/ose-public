import { assign, createMachine, fromPromise } from "xstate";
import type { JournalRuntime } from "./runtime";
import { appendEntries, listEntries, updateEntry, deleteEntry, bumpEntry, clearEntries } from "./journal-store";
import type { JournalEntry, NewEntryInput, UpdateEntryInput } from "./schema";
import type { EntryId } from "./schema";
import type { StoreError } from "./errors";

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
              error: (event as { error: unknown }).error as StoreError,
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
                  error: (event as { error: unknown }).error as StoreError,
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
                  error: (event as { error: unknown }).error as StoreError,
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
