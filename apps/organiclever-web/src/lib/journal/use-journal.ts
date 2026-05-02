import { useMemo } from "react";
import { useActor } from "@xstate/react";
import { journalMachine } from "@/contexts/journal/application/journal-machine";
import type { JournalRuntime } from "./runtime";
import type { JournalEntry, NewEntryInput, UpdateEntryInput } from "@/contexts/journal/domain/schema";
import type { EntryId } from "@/contexts/journal/domain/schema";
import type { StoreError } from "@/contexts/journal/domain/errors";

export type JournalStatus = "loading" | "ready" | "mutating" | "error";

export type UseJournalReturn = {
  entries: ReadonlyArray<JournalEntry>;
  status: JournalStatus;
  error: StoreError | null;
  isMutating: boolean;
  addBatch: (inputs: ReadonlyArray<NewEntryInput>) => void;
  updateEntry: (id: EntryId, input: UpdateEntryInput) => void;
  deleteEntry: (id: EntryId) => void;
  bumpEntry: (id: EntryId) => void;
  clearEntries: () => void;
  retry: () => void;
};

export function useJournal(runtime: JournalRuntime): UseJournalReturn {
  // Provide an empty overrides object to get a configurable actor
  // Runtime is captured via input — never changes during component lifecycle
  const machine = useMemo(() => journalMachine.provide({}), []);

  const [state, send] = useActor(machine, {
    input: { runtime },
  });

  const status: JournalStatus = state.matches("initializing")
    ? "loading"
    : state.matches("error")
      ? "error"
      : state.matches({ ready: "mutating" })
        ? "mutating"
        : "ready";

  const isMutating = state.matches({ ready: "mutating" });

  return {
    entries: state.context.entries,
    status,
    error: state.context.error,
    isMutating,
    addBatch: (inputs) => {
      send({ type: "ADD_BATCH", inputs });
    },
    updateEntry: (id, input) => {
      send({ type: "UPDATE", id, input });
    },
    deleteEntry: (id) => {
      send({ type: "DELETE", id });
    },
    bumpEntry: (id) => {
      send({ type: "BUMP", id });
    },
    clearEntries: () => {
      send({ type: "CLEAR" });
    },
    retry: () => {
      send({ type: "RETRY" });
    },
  };
}
