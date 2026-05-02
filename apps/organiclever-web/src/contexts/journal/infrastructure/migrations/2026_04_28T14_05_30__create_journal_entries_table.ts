import type { PGlite, Transaction } from "@electric-sql/pglite";

export type Queryable = PGlite | Transaction;

export const id = "2026_04_28T14_05_30__create_journal_entries_table";

export async function up(db: Queryable): Promise<void> {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS journal_entries (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL CHECK (length(name) > 0),
      payload     JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at  TIMESTAMPTZ NOT NULL,
      updated_at  TIMESTAMPTZ NOT NULL,
      storage_seq BIGSERIAL
    );
    CREATE INDEX IF NOT EXISTS journal_entries_created_at_desc
      ON journal_entries (created_at DESC, storage_seq ASC);
  `);
}

export async function down(db: Queryable): Promise<void> {
  await db.exec(`
    DROP INDEX IF EXISTS journal_entries_created_at_desc;
    DROP TABLE IF EXISTS journal_entries;
  `);
}
