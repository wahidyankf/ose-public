// Cross-context Effect runtime primitives for the PGlite-backed storage.
//
// The PGlite handle is a single browser-side resource shared across the
// journal, routine, and settings contexts. The `PgliteService` Tag is
// platform-shaped (a database handle abstraction, not an aggregate) and
// belongs in `shared/` rather than any single context's `infrastructure/`.
//
// The journal context owns the journal-aware composition of this Tag
// (the `PgliteLive` Layer + `JOURNAL_STORE_DATA_DIR` constant + the
// migration runner). Cross-context callers that only need the Tag and
// the runtime type — settings, routine, stats — import from here so the
// boundaries plugin sees `infrastructure → shared` rather than
// `infrastructure → infrastructure`.

import { Context, Layer, ManagedRuntime } from "effect";
import type { PGlite } from "@electric-sql/pglite";
import type { StorageUnavailable } from "./errors";

export class PgliteService extends Context.Tag("PgliteService")<PgliteService, { readonly db: PGlite }>() {}

export const makeAppRuntime = (layer: Layer.Layer<PgliteService, StorageUnavailable>) => ManagedRuntime.make(layer);

export type AppRuntime = ReturnType<typeof makeAppRuntime>;
