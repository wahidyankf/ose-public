// Generic storage-layer error types shared across bounded contexts.
//
// `StorageUnavailable` represents a failure to reach the underlying store
// (PGlite handle could not be acquired, IndexedDB blocked, etc.) and is
// raised by every context's infrastructure adapter.
//
// `NotFound` is the cross-context "entity not found by id" error raised
// by every PGlite-backed read/update/delete path — journal entries,
// routine templates, and (in future) any other aggregate addressed by a
// stable id. Both are platform-shaped, not aggregate-shaped, so they live
// in `shared/` rather than any single context's `domain/`.
//
// `journal/domain/errors.ts` re-exports both from here so callers
// importing through `@/contexts/journal/domain` continue to resolve, but
// the canonical owner is `@/shared/runtime`.

import { Data } from "effect";

export class StorageUnavailable extends Data.TaggedError("StorageUnavailable")<{
  readonly cause: unknown;
}> {}

export class NotFound extends Data.TaggedError("NotFound")<{
  readonly id: string;
}> {}
