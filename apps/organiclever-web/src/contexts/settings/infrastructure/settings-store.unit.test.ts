import { layer } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { PGlite } from "@electric-sql/pglite";
import { expect } from "vitest";
import { PgliteService } from "@/contexts/journal/infrastructure/runtime";
import { runMigrations } from "@/contexts/journal/infrastructure/run-migrations";
import { getSettings, saveSettings } from "./settings-store";

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
