/* oxlint-disable vitest/no-standalone-expect -- @effect/vitest it.effect blocks inside layer() are not recognised as test blocks */
import { layer } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { PGlite } from "@electric-sql/pglite";
import { expect } from "vitest";
import { PgliteService } from "@/contexts/journal/infrastructure/runtime";
import { StorageUnavailable } from "@/shared/runtime";
import { runMigrations } from "@/contexts/journal/infrastructure/run-migrations";
import { getSettings, saveSettings } from "../../../../../src/contexts/settings/infrastructure/settings-store";

// ---------------------------------------------------------------------------
// A PGlite handle whose `query` returns a pre-scripted sequence of
// responses, one per call. Used to reach settings-store's internal
// concurrent-writer race branches (empty INSERT, reread, etc.) that real
// PGlite — being single-writer in these tests — never actually races into.
// ---------------------------------------------------------------------------

type FakeRow = { id: string; name: string; rest_seconds: string; dark_mode: boolean; lang: string };

function sequencedDbLayer(responses: Array<() => Promise<{ rows: FakeRow[] }>>) {
  let call = 0;
  return Layer.scoped(
    PgliteService,
    Effect.acquireRelease(
      Effect.sync(() => ({
        db: {
          query: () => {
            const handler = responses[call] ?? (() => Promise.reject(new Error(`unexpected call #${call}`)));
            call += 1;
            return handler();
          },
        } as unknown as PGlite,
      })),
      () => Effect.void,
    ),
  );
}

const makeFakeRow = (overrides: Partial<FakeRow> = {}): FakeRow => ({
  id: "singleton",
  name: "User",
  rest_seconds: "60",
  dark_mode: false,
  lang: "en",
  ...overrides,
});

// ---------------------------------------------------------------------------
// Layer factory — each test suite gets its own fresh in-memory DB
// ---------------------------------------------------------------------------

function makeFreshLayer() {
  return Layer.scoped(
    PgliteService,
    Effect.acquireRelease(
      Effect.promise(async () => {
        const db = new PGlite();
        await runMigrations(db);
        return { db };
      }),
      ({ db }) => Effect.promise(() => db.close()),
    ),
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

layer(makeFreshLayer())("settings-store - getSettings creates default row", (it) => {
  it.effect("creates and returns default settings on empty DB", () =>
    Effect.gen(function* () {
      const settings = yield* getSettings();

      expect(settings.name).toBe("User");
      expect(settings.restSeconds).toBe(60);
      expect(settings.darkMode).toBe(false);
      expect(settings.lang).toBe("en");
    }),
  );

  it.effect("is idempotent — calling twice returns the same row", () =>
    Effect.gen(function* () {
      const first = yield* getSettings();
      const second = yield* getSettings();

      expect(second.name).toBe(first.name);
      expect(second.restSeconds).toBe(first.restSeconds);
      expect(second.darkMode).toBe(first.darkMode);
      expect(second.lang).toBe(first.lang);
    }),
  );
});

layer(makeFreshLayer())("settings-store - saveSettings updates name", (it) => {
  it.effect("updates name while keeping other fields", () =>
    Effect.gen(function* () {
      const saved = yield* saveSettings({ name: "Alice" });

      expect(saved.name).toBe("Alice");
      expect(saved.restSeconds).toBe(60);
      expect(saved.darkMode).toBe(false);
      expect(saved.lang).toBe("en");

      // Verify persisted
      const reloaded = yield* getSettings();
      expect(reloaded.name).toBe("Alice");
    }),
  );
});

layer(makeFreshLayer())("settings-store - saveSettings updates darkMode", (it) => {
  it.effect("updates darkMode to true", () =>
    Effect.gen(function* () {
      const saved = yield* saveSettings({ darkMode: true });

      expect(saved.darkMode).toBe(true);
      expect(saved.name).toBe("User");
      expect(saved.lang).toBe("en");
    }),
  );
});

layer(makeFreshLayer())("settings-store - saveSettings updates lang", (it) => {
  it.effect("updates lang to 'id'", () =>
    Effect.gen(function* () {
      const saved = yield* saveSettings({ lang: "id" });

      expect(saved.lang).toBe("id");
      expect(saved.name).toBe("User");
      expect(saved.darkMode).toBe(false);
    }),
  );
});

layer(makeFreshLayer())("settings-store - saveSettings updates restSeconds numeric", (it) => {
  it.effect("updates restSeconds to 30", () =>
    Effect.gen(function* () {
      const saved = yield* saveSettings({ restSeconds: 30 });

      expect(saved.restSeconds).toBe(30);
      expect(saved.name).toBe("User");
      expect(saved.darkMode).toBe(false);
      expect(saved.lang).toBe("en");

      // Verify persisted correctly
      const reloaded = yield* getSettings();
      expect(reloaded.restSeconds).toBe(30);
    }),
  );
});

layer(makeFreshLayer())("settings-store - saveSettings updates restSeconds reps", (it) => {
  it.effect("updates restSeconds to 'reps'", () =>
    Effect.gen(function* () {
      const saved = yield* saveSettings({ restSeconds: "reps" });

      expect(saved.restSeconds).toBe("reps");

      const reloaded = yield* getSettings();
      expect(reloaded.restSeconds).toBe("reps");
    }),
  );

  it.effect("updates restSeconds to 'reps2'", () =>
    Effect.gen(function* () {
      const saved = yield* saveSettings({ restSeconds: "reps2" });

      expect(saved.restSeconds).toBe("reps2");

      const reloaded = yield* getSettings();
      expect(reloaded.restSeconds).toBe("reps2");
    }),
  );
});

layer(makeFreshLayer())("settings-store - parseRestSeconds fallback", (it) => {
  it.effect("falls back to the default restSeconds for an unexpected stored value", () =>
    Effect.gen(function* () {
      const { db } = yield* PgliteService;
      yield* Effect.promise(() =>
        db.exec(
          `INSERT INTO settings (id, name, rest_seconds, dark_mode, lang)
           VALUES ('singleton', 'User', '999', false, 'en')`,
        ),
      );

      const settings = yield* getSettings();
      expect(settings.restSeconds).toBe(60);
    }),
  );
});

layer(sequencedDbLayer([() => Promise.reject(new Error("select failed"))]))(
  "settings-store - getSettings StorageUnavailable on the initial SELECT",
  (it) => {
    it.effect("surfaces StorageUnavailable", () =>
      Effect.gen(function* () {
        const result = yield* Effect.either(getSettings());
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(StorageUnavailable);
        }
      }),
    );
  },
);

layer(sequencedDbLayer([() => Promise.resolve({ rows: [] }), () => Promise.reject(new Error("insert failed"))]))(
  "settings-store - getSettings StorageUnavailable on the lazy-create INSERT",
  (it) => {
    it.effect("surfaces StorageUnavailable", () =>
      Effect.gen(function* () {
        const result = yield* Effect.either(getSettings());
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(StorageUnavailable);
        }
      }),
    );
  },
);

layer(
  sequencedDbLayer([
    () => Promise.resolve({ rows: [] }),
    () => Promise.resolve({ rows: [] }),
    () => Promise.reject(new Error("reread failed")),
  ]),
)("settings-store - getSettings StorageUnavailable on the concurrent-writer reread", (it) => {
  it.effect("surfaces StorageUnavailable when INSERT lost the race and the reread itself fails", () =>
    Effect.gen(function* () {
      const result = yield* Effect.either(getSettings());
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(StorageUnavailable);
      }
    }),
  );
});

layer(
  sequencedDbLayer([
    () => Promise.resolve({ rows: [] }),
    () => Promise.resolve({ rows: [] }),
    () => Promise.resolve({ rows: [makeFakeRow({ name: "Concurrent Writer" })] }),
  ]),
)("settings-store - getSettings concurrent-writer reread success", (it) => {
  it.effect("returns the row a concurrent writer already inserted", () =>
    Effect.gen(function* () {
      const settings = yield* getSettings();
      expect(settings.name).toBe("Concurrent Writer");
    }),
  );
});

layer(
  sequencedDbLayer([
    () => Promise.resolve({ rows: [] }),
    () => Promise.resolve({ rows: [] }),
    () => Promise.resolve({ rows: [] }),
  ]),
)("settings-store - getSettings triple-empty safety net", (it) => {
  it.effect("returns in-memory defaults when SELECT, INSERT, and reread are all empty", () =>
    Effect.gen(function* () {
      const settings = yield* getSettings();
      expect(settings).toEqual({ name: "User", restSeconds: 60, darkMode: false, lang: "en" });
    }),
  );
});

layer(
  sequencedDbLayer([
    () => Promise.resolve({ rows: [makeFakeRow()] }),
    () => Promise.reject(new Error("upsert failed")),
  ]),
)("settings-store - saveSettings StorageUnavailable on UPSERT failure", (it) => {
  it.effect("surfaces StorageUnavailable", () =>
    Effect.gen(function* () {
      const result = yield* Effect.either(saveSettings({ name: "Bob" }));
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(StorageUnavailable);
      }
    }),
  );
});

layer(sequencedDbLayer([() => Promise.resolve({ rows: [makeFakeRow()] }), () => Promise.resolve({ rows: [] })]))(
  "settings-store - saveSettings defensive no-row fallback",
  (it) => {
    it.effect("fails with StorageUnavailable when UPSERT RETURNING yields no rows", () =>
      Effect.gen(function* () {
        const result = yield* Effect.either(saveSettings({ name: "Bob" }));
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(StorageUnavailable);
        }
      }),
    );
  },
);
