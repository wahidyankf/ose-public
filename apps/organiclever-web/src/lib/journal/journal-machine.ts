import { assign, createMachine, fromPromise } from "xstate";
import { Cause, Option, Runtime } from "effect";
import type { JournalRuntime } from "./runtime";
import { appendEntries, listEntries, updateEntry, deleteEntry, bumpEntry, clearEntries } from "./journal-store";
import type { JournalEntry, NewEntryInput, UpdateEntryInput } from "./schema";
import type { EntryId } from "./schema";
import type { StoreError } from "./errors";

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
  /** The event being processed by the current invocation of performMutation. */
  currentMutationEvent: JournalEvent | null;
  /**
   * A mutation event received while another mutation is in flight. Only the
   * most-recent queued event is kept — rapid-fire submits are coalesced to
   * the last one so they don't pile up indefinitely.
   */
  pendingMutationEvent: JournalEvent | null;
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

const MUTATION_EVENTS = ["ADD_BATCH", "UPDATE", "DELETE", "BUMP", "CLEAR"] as const;

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
      currentMutationEvent: null,
      pendingMutationEvent: null,
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
            // Auto-process any event that arrived while a mutation was in flight.
            always: {
              guard: ({ context }) => context.pendingMutationEvent != null,
              target: "mutating",
              actions: assign(({ context }) => ({
                currentMutationEvent: context.pendingMutationEvent,
                pendingMutationEvent: null,
              })),
            },
            on: {
              ADD_BATCH: {
                target: "mutating",
                actions: assign({ currentMutationEvent: ({ event }) => event }),
              },
              UPDATE: {
                target: "mutating",
                actions: assign({ currentMutationEvent: ({ event }) => event }),
              },
              DELETE: {
                target: "mutating",
                actions: assign({ currentMutationEvent: ({ event }) => event }),
              },
              BUMP: {
                target: "mutating",
                actions: assign({ currentMutationEvent: ({ event }) => event }),
              },
              CLEAR: {
                target: "mutating",
                actions: assign({ currentMutationEvent: ({ event }) => event }),
              },
            },
          },
          mutating: {
            invoke: {
              src: "performMutation",
              input: ({ context }: { context: JournalContext }): PerformMutationInput => ({
                runtime: context.runtime,
                // currentMutationEvent is always set when entering mutating
                event: context.currentMutationEvent!,
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
            // Buffer the most-recent mutation event that arrives during an
            // in-flight mutation. When the current mutation finishes, idle's
            // `always` transition will pick it up automatically.
            on: Object.fromEntries(
              MUTATION_EVENTS.map((type) => [
                type,
                { actions: assign({ pendingMutationEvent: ({ event }: { event: JournalEvent }) => event }) },
              ]),
            ),
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
      // performMutation now also reloads the list and returns it, so `onDone`
      // can assign fresh entries without a separate reloading state. This
      // keeps the machine in `mutating` for the full duration and eliminates
      // the old `reloading` dead-state that also dropped buffered events.
      performMutation: fromPromise(
        async ({ input }: { input: PerformMutationInput }): Promise<ReadonlyArray<JournalEntry>> => {
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
          return runtime.runPromise(listEntries());
        },
      ),
    },
  },
);
