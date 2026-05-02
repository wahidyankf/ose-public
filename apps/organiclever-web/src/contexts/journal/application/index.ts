// journal context — application layer published API.
//
// Use-cases for the journal aggregate, published for cross-context callers
// and the presentation layer to consume. Follows the same hexagonal shape
// as `settings/application/index.ts` (Phase 5): a thin barrel re-exporting
// the Effect-typed store functions, with domain types re-exported as a
// stable type contract.
//
// The store implementations currently live at `@/lib/journal/journal-store`
// while the infrastructure layer is still in flight (sub-step 6c moves
// them into `../infrastructure/journal-store`). Cross-context callers and
// presentation MUST import from this barrel — not from infrastructure or
// the legacy `@/lib/journal/` paths — so the eventual port indirection
// lands as a single edit here rather than a wide find-and-replace.
//
// Use-case naming notes (per `tech-docs.md` § "xstate machine placement"
// and the bounded-context map):
// - `appendEntries` is the batched form of the ubiquitous-language
//   "append journal event" use-case.
// - `bumpEntry` re-orders an existing journal event to "now" without
//   altering its payload.
// - `listEntries` returns the canonical event log ordered most-recent
//   first.
// - `updateEntry`, `deleteEntry`, `clearEntries` round out the mutation
//   API used by the journal-machine and presentation hooks.

export {
  appendEntries,
  listEntries,
  updateEntry,
  deleteEntry,
  bumpEntry,
  clearEntries,
} from "@/lib/journal/journal-store";

export { journalMachine } from "./journal-machine";
export type { JournalContext, JournalEvent } from "./journal-machine";

// Domain types re-exported through the application barrel so cross-context
// callers do not need a second import line for the value types.
export type {
  JournalEntry,
  EntryId,
  EntryName,
  EntryPayload,
  IsoTimestamp,
  NewEntryInput,
  UpdateEntryInput,
  StoreError,
} from "../domain";
