// settings context — application layer published API.
//
// Use-cases for reading and writing user preferences. The current shape
// re-exports the PGlite-backed implementations directly from
// `infrastructure/settings-store.ts`. A future plan introduces an explicit
// storage port (interface in `application/ports.ts`, live binding in
// `infrastructure/`); until then the application layer is a thin pass-
// through. Consumers outside this context MUST import from this barrel —
// not from `infrastructure/` — so the eventual port indirection lands as
// a one-file change rather than a wide find-and-replace.

export { getSettings, saveSettings } from "../infrastructure";
export type { AppSettings, RestSeconds, Lang } from "../domain";
