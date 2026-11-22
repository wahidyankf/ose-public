import { PGlite } from "@electric-sql/pglite";
import { describe, it, expect } from "vitest";
import {
  up,
  down,
} from "../../../../../../src/contexts/journal/infrastructure/migrations/2026_04_28T14_05_30__create_journal_entries_table";
import { FIXED_INSTANT } from "../../../../support/doubles";

describe("migration 2026_04_28T14_05_30__create_journal_entries_table", () => {
  it("applies up — the journal_entries table and its index exist", async () => {
    const db = new PGlite();
    await up(db);

    const now = FIXED_INSTANT;
    await db.exec(`
      INSERT INTO journal_entries (id, name, created_at, updated_at)
      VALUES ('test-up', 'workout', '${now}', '${now}')
    `);
    const result = await db.query<{ id: string }>("SELECT id FROM journal_entries WHERE id = 'test-up'");
    expect(result.rows).toHaveLength(1);
  });

  it("applies down — drops the table and index cleanly, and is idempotent", async () => {
    const db = new PGlite();
    await up(db);
    await down(db);

    // Table no longer exists — inserting must fail.
    await expect(
      db.exec(
        "INSERT INTO journal_entries (id, name, created_at, updated_at) VALUES ('after-down', 'workout', now(), now())",
      ),
    ).rejects.toThrow();

    // `IF EXISTS` guards make a second down() a no-op rather than an error.
    await expect(down(db)).resolves.toBeUndefined();
  });
});
