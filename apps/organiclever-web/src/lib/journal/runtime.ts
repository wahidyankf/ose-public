import { Context, Effect, Layer, ManagedRuntime } from "effect";
import type { PGlite } from "@electric-sql/pglite";
import { runMigrations } from "./run-migrations";
import { StorageUnavailable } from "./errors";

export const JOURNAL_STORE_DATA_DIR = "ol_journal_v1";

export class PgliteService extends Context.Tag("PgliteService")<PgliteService, { readonly db: PGlite }>() {}

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
        if (process.env.NODE_ENV !== "production") {
          (globalThis as { __ol_db?: PGlite }).__ol_db = db;
        }
        return { db };
      },
      catch: (cause): StorageUnavailable => new StorageUnavailable({ cause }),
    }),
    ({ db }) => Effect.promise(() => db.close()),
  ),
);

export const makeJournalRuntime = (layer: Layer.Layer<PgliteService, StorageUnavailable> = PgliteLive) =>
  ManagedRuntime.make(layer);

export type JournalRuntime = ReturnType<typeof makeJournalRuntime>;
