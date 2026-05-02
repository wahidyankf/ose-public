import { describe, it, expect, vi } from "vitest";
import { Cause, Effect, Layer } from "effect";
import { PGlite } from "@electric-sql/pglite";
import { PgliteService, makeJournalRuntime } from "./runtime";
import { runMigrations } from "./run-migrations";
import { StorageUnavailable } from "@/contexts/journal/domain/errors";

describe("runtime - makeJournalRuntime", () => {
  it("acquires and releases the PGlite handle", async () => {
    const closeSpy = vi.fn().mockResolvedValue(undefined);

    const spyLayer = Layer.scoped(
      PgliteService,
      Effect.acquireRelease(
        Effect.tryPromise({
          try: async () => {
            const db = new PGlite();
            await runMigrations(db);
            const originalClose = db.close.bind(db);
            db.close = async () => {
              closeSpy();
              return originalClose();
            };
            return { db };
          },
          catch: (cause): StorageUnavailable => new StorageUnavailable({ cause }),
        }),
        ({ db }) => Effect.promise(() => db.close()),
      ),
    );

    const runtime = makeJournalRuntime(spyLayer);

    // Use the runtime to confirm it's working
    await runtime.runPromise(
      Effect.gen(function* () {
        const { db } = yield* PgliteService;
        const result = yield* Effect.promise(() => db.query<{ id: string }>("SELECT id FROM _migrations"));
        expect(result.rows).toHaveLength(2);
      }),
    );

    await runtime.dispose();
    expect(closeSpy).toHaveBeenCalledTimes(1);
  });

  it("yields StorageUnavailable when PGlite throws on init", async () => {
    const failingLayer = Layer.scoped(
      PgliteService,
      Effect.acquireRelease(
        Effect.tryPromise({
          try: async () => {
            throw new Error("init failure");
          },
          catch: (cause): StorageUnavailable => new StorageUnavailable({ cause }),
        }),
        () => Effect.void,
      ),
    );

    const runtime = makeJournalRuntime(failingLayer);

    // ManagedRuntime wraps errors in FiberFailure; use runPromiseExit to inspect
    const exit = await runtime.runPromiseExit(
      Effect.gen(function* () {
        yield* PgliteService;
      }),
    );

    expect(exit._tag).toBe("Failure");
    if (exit._tag === "Failure") {
      const failure = Cause.failureOption(exit.cause);
      expect(failure._tag).toBe("Some");
      if (failure._tag === "Some") {
        expect(failure.value).toBeInstanceOf(StorageUnavailable);
      }
    }
    await runtime.dispose();
  });

  it("uses test layer correctly when window is available", async () => {
    const testLayer = Layer.scoped(
      PgliteService,
      Effect.acquireRelease(
        Effect.tryPromise({
          try: async () => {
            const db = new PGlite();
            await runMigrations(db);
            return { db };
          },
          catch: (cause): StorageUnavailable => new StorageUnavailable({ cause }),
        }),
        ({ db }) => Effect.promise(() => db.close()),
      ),
    );

    const runtime = makeJournalRuntime(testLayer);

    const result = await runtime.runPromise(
      Effect.gen(function* () {
        const { db } = yield* PgliteService;
        return db !== null;
      }),
    );

    expect(result).toBe(true);
    await runtime.dispose();
  });
});
