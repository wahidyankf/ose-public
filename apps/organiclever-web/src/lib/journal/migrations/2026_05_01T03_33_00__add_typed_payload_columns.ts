import type { PGlite, Transaction } from "@electric-sql/pglite";
type Queryable = PGlite | Transaction;

export const id = "2026_05_01T03_33_00__add_typed_payload_columns";

export async function up(db: Queryable): Promise<void> {
  await db.exec(`
    ALTER TABLE journal_entries
      ADD COLUMN started_at  TIMESTAMPTZ,
      ADD COLUMN finished_at TIMESTAMPTZ,
      ADD COLUMN labels      TEXT[] NOT NULL DEFAULT '{}';

    UPDATE journal_entries
      SET started_at  = created_at,
          finished_at = updated_at
      WHERE started_at IS NULL;

    ALTER TABLE journal_entries
      ALTER COLUMN started_at  SET NOT NULL,
      ALTER COLUMN finished_at SET NOT NULL;

    ALTER TABLE journal_entries
      ADD CONSTRAINT journal_entries_kind_v0
      CHECK (name IN ('workout','reading','learning','meal','focus') OR name LIKE 'custom-%');

    CREATE TABLE IF NOT EXISTS routines (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      hue         TEXT NOT NULL,
      type        TEXT NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL,
      groups      JSONB NOT NULL DEFAULT '[]'::jsonb
    );

    CREATE TABLE IF NOT EXISTS settings (
      id            TEXT PRIMARY KEY DEFAULT 'singleton',
      name          TEXT NOT NULL,
      rest_seconds  TEXT NOT NULL,
      dark_mode     BOOLEAN NOT NULL DEFAULT false,
      lang          TEXT NOT NULL DEFAULT 'en',
      CHECK (id = 'singleton')
    );
  `);
}

export async function down(db: Queryable): Promise<void> {
  await db.exec(`
    DROP TABLE IF EXISTS settings;
    DROP TABLE IF EXISTS routines;
    ALTER TABLE journal_entries DROP CONSTRAINT IF EXISTS journal_entries_kind_v0;
    ALTER TABLE journal_entries DROP COLUMN IF EXISTS labels;
    ALTER TABLE journal_entries DROP COLUMN IF EXISTS finished_at;
    ALTER TABLE journal_entries DROP COLUMN IF EXISTS started_at;
  `);
}
