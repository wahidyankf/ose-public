import { Effect, Layer } from "effect";
import type { PGlite } from "@electric-sql/pglite";
import { PgliteService, makeAppRuntime } from "@/shared/runtime";
import type { AppRuntime } from "@/shared/runtime";
import { StorageUnavailable } from "@/shared/runtime";
import { runMigrations } from "./run-migrations";

export const JOURNAL_STORE_DATA_DIR = "ol_journal_v1";

// Journal-aware `PgliteService` Layer: opens the PGlite database under the
// journal-owned IDB dir and runs the journal context's schema migrations
// before publishing the handle. The Tag itself lives in `@/shared/runtime`
// because the same Tag is consumed by routine, settings, and stats.
export const PgliteLive: Layer.Layer<PgliteService, StorageUnavailable> = Layer.scoped(
  PgliteService,
  Effect.acquireRelease(
    Effect.tryPromise({
      try: async () => {
        if (typeof window === "undefined") {
          throw new Error("PGlite cannot open during SSR");
        }
        const { PGlite } = await import("@electric-sql/pglite");
        const db = new PGlite(`idb://${JOURNAL_STORE_DATA_DIR}`);
        await runMigrations(db);
        // Expose handle on globalThis for E2E test assertions — safe because
        // PGlite is client-side only (IndexedDB) and users already have full
        // browser access to the underlying data regardless of this handle.
        (globalThis as { __ol_db?: PGlite }).__ol_db = db;
        return { db };
      },
      catch: (cause): StorageUnavailable => new StorageUnavailable({ cause }),
    }),
    ({ db }) => Effect.promise(() => db.close()),
  ),
);

// Backwards-compatible aliases: the journal context historically owned the
// runtime constructor and `JournalRuntime` type; cross-context callers and
// tests still import them from journal. The implementation now lives in
// `@/shared/runtime`; these are thin re-exports.
export const makeJournalRuntime = (layer: Layer.Layer<PgliteService, StorageUnavailable> = PgliteLive) =>
  makeAppRuntime(layer);

export type JournalRuntime = AppRuntime;

// Re-export the Tag through the journal infrastructure path so existing
// barrels (`journal/infrastructure/index.ts`, `journal/application/index.ts`)
// continue to publish it. Cross-context infrastructure callers should
// import directly from `@/shared/runtime` instead — the boundaries plugin
// classifies that as `infrastructure → shared` (allowed) rather than
// cross-context infrastructure → infrastructure.
export { PgliteService } from "@/shared/runtime";
