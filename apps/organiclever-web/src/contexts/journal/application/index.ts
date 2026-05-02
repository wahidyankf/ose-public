// journal context — application layer published API.
//
// Use-cases for the journal aggregate, published for cross-context callers
// and the presentation layer to consume. Follows the same hexagonal shape
// as `settings/application/index.ts` (Phase 5): a thin barrel re-exporting
// the Effect-typed store functions, with domain types re-exported as a
// stable type contract.
//
// All implementations live under `../infrastructure/`; this barrel
// re-exports them so cross-context callers and presentation MUST import
// from this barrel — not from infrastructure directly — so the eventual
// port indirection lands as a single edit here rather than a wide
// find-and-replace.
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
} from "../infrastructure/journal-store";

export { journalMachine } from "./journal-machine";
export type { JournalContext, JournalEvent } from "./journal-machine";

// Runtime composition + seed routine are exposed here so the Next.js
// `src/app/**` layer (boundary type `app`) and other contexts that need
// to bootstrap the journal store can consume them through the published
// application API rather than reaching into infrastructure directly. The
// app-shell context will eventually compose a single shared `Runtime`
// Layer (per `tech-docs.md` § "Risk mitigations") and these re-exports
// will collapse to that composed runtime.
export { makeJournalRuntime, PgliteService, PgliteLive, JOURNAL_STORE_DATA_DIR } from "../infrastructure/runtime";
export type { JournalRuntime } from "../infrastructure/runtime";
export { seedIfEmpty } from "../infrastructure/seed";

// Domain types re-exported through the application barrel so cross-context
// callers do not need a second import line for the value types. Effect
// Schema's `EntryName`, `EntryPayload`, `IsoTimestamp`, `EntryId` are
// runtime constants whose `typeof X.Type` carries the branded type, so a
// value-export covers both the type and the runtime decoder. `JournalEntry`,
// `NewEntryInput`, `UpdateEntryInput` are also runtime Schema constants.
export {
  JournalEntry,
  EntryId,
  EntryName,
  EntryPayload,
  IsoTimestamp,
  NewEntryInput,
  UpdateEntryInput,
} from "../domain/schema";

// Tagged error classes are runtime constructors (so callers can match
// `_tag` and throw new instances), not pure types — value-export them.
export { NotFound, StorageUnavailable, InvalidPayload, EmptyBatch } from "../domain/errors";
export type { StoreError } from "../domain";

// Migration runner is an infrastructure utility, but tests inside other
// bounded contexts (routine, stats, settings) need it to bootstrap an
// in-memory PGlite. Re-exporting through the application barrel keeps
// those tests on the published-API path; once each downstream context
// owns its own runtime composition or storage port, this re-export
// collapses.
export { runMigrations } from "../infrastructure/run-migrations";

// Per-kind typed payload Schemas + their inferred types are re-exported
// here so cross-context callers (loggers, workout-session, history
// projections, etc.) can consume the canonical event shapes through the
// application barrel rather than reaching into `domain/typed-payloads`.
export {
  ExerciseTemplate,
  CompletedSet,
  ActiveExercise,
  WorkoutPayload,
  ReadingPayload,
  LearningPayload,
  MealPayload,
  FocusPayload,
  CustomPayload,
  TypedEntry,
} from "../domain/typed-payloads";
export type { Hue, ExerciseType, TimerMode } from "../domain/typed-payloads";
