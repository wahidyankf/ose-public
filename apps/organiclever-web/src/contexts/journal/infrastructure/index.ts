// journal context — infrastructure layer published API.
//
// Re-exports the PGlite-backed implementations of the journal use-cases,
// the runtime constructor and `PgliteService` token, and the migration
// runner. Application-layer callers go through
// `@/contexts/journal/application` (which re-exports the use-cases from
// here); cross-context callers needing the shared `PgliteService` /
// `JournalRuntime` symbols import from this barrel directly until the
// app-shell composes a single shared runtime in a future plan.

export { appendEntries, listEntries, updateEntry, deleteEntry, bumpEntry, clearEntries } from "./journal-store";

export { PgliteService, PgliteLive, makeJournalRuntime, JOURNAL_STORE_DATA_DIR } from "./runtime";
export type { JournalRuntime } from "./runtime";

export { runMigrations } from "./run-migrations";
