// settings context — infrastructure layer.
//
// PGlite-backed implementation of the settings storage use-cases. The
// `getSettings` / `saveSettings` Effect-shaped functions are the published
// API of this layer (re-exported via `infrastructure/index.ts` and bridged
// through `application/index.ts` until an explicit storage port is
// introduced in a future plan).
//
// Cross-context infrastructure coupling: this file imports `PgliteService`
// from `@/lib/journal/runtime` and `StorageUnavailable` from
// `@/lib/journal/errors`. That coupling is intentional for the duration of
// Phase 5 — the journal infrastructure (runtime + errors) migrates to
// `@/contexts/journal/infrastructure/...` in Phase 6, and this import path
// updates then. ESLint `boundaries/element-types` warns about the
// cross-context infra import; the warning is expected and resolves in
// Phase 6.

import { Effect } from "effect";
import { PgliteService } from "@/contexts/journal/infrastructure/runtime";
import { StorageUnavailable } from "@/contexts/journal/domain/errors";
import type { AppSettings, RestSeconds, Lang } from "../domain";

// Re-export domain types so that consumers importing from this module
// continue to compile while we keep the migration step small. The
// authoritative type owner is `domain/types.ts`.
export type { AppSettings, RestSeconds, Lang };

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_SETTINGS: AppSettings = {
  name: "User",
  restSeconds: 60,
  darkMode: false,
  lang: "en",
};

// ---------------------------------------------------------------------------
// Internal row shape returned from PGlite queries
// ---------------------------------------------------------------------------

type SettingsRow = {
  id: string;
  name: string;
  rest_seconds: string;
  dark_mode: boolean;
  lang: string;
};

function parseRestSeconds(raw: string): RestSeconds {
  if (raw === "reps" || raw === "reps2") return raw;
  const n = Number(raw);
  if (n === 0 || n === 30 || n === 60 || n === 90) return n as RestSeconds;
  // Fallback to default if stored value is unexpected
  return DEFAULT_SETTINGS.restSeconds;
}

function rowToSettings(row: SettingsRow): AppSettings {
  return {
    name: row.name,
    restSeconds: parseRestSeconds(row.rest_seconds),
    darkMode: row.dark_mode,
    lang: row.lang as Lang,
  };
}

// ---------------------------------------------------------------------------
// Store functions
// ---------------------------------------------------------------------------

export function getSettings(): Effect.Effect<AppSettings, StorageUnavailable, PgliteService> {
  return Effect.gen(function* () {
    const { db } = yield* PgliteService;

    const result = yield* Effect.tryPromise({
      try: () =>
        db.query<SettingsRow>(
          `SELECT id, name, rest_seconds, dark_mode, lang
           FROM settings
           WHERE id = 'singleton'`,
        ),
      catch: (cause): StorageUnavailable => new StorageUnavailable({ cause }),
    });

    const row = result.rows[0];
    if (row) {
      return rowToSettings(row);
    }

    // Lazy create default row
    const inserted = yield* Effect.tryPromise({
      try: () =>
        db.query<SettingsRow>(
          `INSERT INTO settings (id, name, rest_seconds, dark_mode, lang)
           VALUES ('singleton', $1, $2, $3, $4)
           ON CONFLICT (id) DO NOTHING
           RETURNING id, name, rest_seconds, dark_mode, lang`,
          [
            DEFAULT_SETTINGS.name,
            String(DEFAULT_SETTINGS.restSeconds),
            DEFAULT_SETTINGS.darkMode,
            DEFAULT_SETTINGS.lang,
          ],
        ),
      catch: (cause): StorageUnavailable => new StorageUnavailable({ cause }),
    });

    const insertedRow = inserted.rows[0];
    if (insertedRow) {
      return rowToSettings(insertedRow);
    }

    // ON CONFLICT DO NOTHING may return empty rows if another concurrent writer
    // won the race — re-read the row that was already there.
    const reread = yield* Effect.tryPromise({
      try: () =>
        db.query<SettingsRow>(
          `SELECT id, name, rest_seconds, dark_mode, lang
           FROM settings
           WHERE id = 'singleton'`,
        ),
      catch: (cause): StorageUnavailable => new StorageUnavailable({ cause }),
    });

    const rereadRow = reread.rows[0];
    if (rereadRow) {
      return rowToSettings(rereadRow);
    }

    // Should never reach here; return defaults as safety net
    return DEFAULT_SETTINGS;
  });
}

export function saveSettings(
  patch: Partial<AppSettings>,
): Effect.Effect<AppSettings, StorageUnavailable, PgliteService> {
  return Effect.gen(function* () {
    const current = yield* getSettings();
    const merged: AppSettings = { ...current, ...patch };

    const { db } = yield* PgliteService;

    const result = yield* Effect.tryPromise({
      try: () =>
        db.query<SettingsRow>(
          `INSERT INTO settings (id, name, rest_seconds, dark_mode, lang)
           VALUES ('singleton', $1, $2, $3, $4)
           ON CONFLICT (id) DO UPDATE
             SET name         = EXCLUDED.name,
                 rest_seconds = EXCLUDED.rest_seconds,
                 dark_mode    = EXCLUDED.dark_mode,
                 lang         = EXCLUDED.lang
           RETURNING id, name, rest_seconds, dark_mode, lang`,
          [merged.name, String(merged.restSeconds), merged.darkMode, merged.lang],
        ),
      catch: (cause): StorageUnavailable => new StorageUnavailable({ cause }),
    });

    const row = result.rows[0];
    if (!row) {
      return yield* Effect.fail(new StorageUnavailable({ cause: new Error("UPSERT returned no rows") }));
    }

    return rowToSettings(row);
  });
}
