import { PGlite } from "@electric-sql/pglite";
import { describe, it, expect, beforeEach } from "vitest";
import { up as upV1 } from "./2026_04_28T14_05_30__create_journal_entries_table";
import { up as upV2, down as downV2 } from "./2026_05_01T03_33_00__add_typed_payload_columns";

describe("migration 2026_05_01T03_33_00__add_typed_payload_columns", () => {
  let db: PGlite;

  beforeEach(async () => {
    db = new PGlite();
    await upV1(db);
  });

  it("applies v2 — new columns and tables exist after migration", async () => {
    await upV2(db);

    // Verify new columns exist by inserting a row with them
    const now = new Date().toISOString();
    await db.exec(`
      INSERT INTO journal_entries (id, name, payload, created_at, updated_at, started_at, finished_at, labels)
      VALUES ('test-col-check', 'workout', '{}', '${now}', '${now}', '${now}', '${now}', '{}')
    `);

    const result = await db.query<{ id: string; labels: string }>(
      "SELECT id, labels FROM journal_entries WHERE id = 'test-col-check'",
    );
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.id).toBe("test-col-check");

    // Verify routines table exists
    await db.exec(
      "INSERT INTO routines (id, name, hue, type, created_at, groups) VALUES ('r1', 'test', '200', 'strength', now(), '[]')",
    );
    const routinesResult = await db.query<{ id: string }>("SELECT id FROM routines WHERE id = 'r1'");
    expect(routinesResult.rows).toHaveLength(1);

    // Verify settings table exists
    await db.exec("INSERT INTO settings (id, name, rest_seconds) VALUES ('singleton', 'Test User', '60')");
    const settingsResult = await db.query<{ id: string }>("SELECT id FROM settings WHERE id = 'singleton'");
    expect(settingsResult.rows).toHaveLength(1);
  });

  it("backfill — started_at = created_at and finished_at = updated_at for rows inserted before v2", async () => {
    // Insert rows using only v1 columns (before v2 migration)
    const createdAt = "2026-04-01T10:00:00Z";
    const updatedAt = "2026-04-01T12:00:00Z";
    await db.exec(`
      INSERT INTO journal_entries (id, name, payload, created_at, updated_at)
      VALUES ('backfill-1', 'workout', '{}', '${createdAt}', '${updatedAt}')
    `);

    // Apply v2 migration
    await upV2(db);

    type Row = { id: string; started_at: string; finished_at: string };
    const result = await db.query<Row>(
      "SELECT id, started_at::text AS started_at, finished_at::text AS finished_at FROM journal_entries WHERE id = 'backfill-1'",
    );
    expect(result.rows).toHaveLength(1);

    const row = result.rows[0];
    if (!row) throw new Error("Expected backfill row");

    // started_at should equal created_at; finished_at should equal updated_at
    // Compare as timestamps (PGlite may return ISO strings)
    expect(new Date(row.started_at).getTime()).toBe(new Date(createdAt).getTime());
    expect(new Date(row.finished_at).getTime()).toBe(new Date(updatedAt).getTime());
  });

  it("CHECK constraint — inserting name='unknown' after v2 is rejected", async () => {
    await upV2(db);

    const now = new Date().toISOString();
    await expect(
      db.exec(`
        INSERT INTO journal_entries (id, name, payload, created_at, updated_at, started_at, finished_at, labels)
        VALUES ('bad-name', 'unknown', '{}', '${now}', '${now}', '${now}', '${now}', '{}')
      `),
    ).rejects.toThrow();
  });

  it("CHECK constraint — valid names are accepted after v2", async () => {
    await upV2(db);

    const now = new Date().toISOString();
    for (const name of ["workout", "reading", "learning", "meal", "focus", "custom-run"]) {
      await db.exec(`
        INSERT INTO journal_entries (id, name, payload, created_at, updated_at, started_at, finished_at, labels)
        VALUES ('${name}-id', '${name}', '{}', '${now}', '${now}', '${now}', '${now}', '{}')
      `);
    }

    const result = await db.query<{ id: string }>("SELECT id FROM journal_entries");
    expect(result.rows).toHaveLength(6);
  });

  it("down — removes v2 additions cleanly", async () => {
    await upV2(db);
    await downV2(db);

    // After down, routines and settings tables should not exist
    await expect(db.query("SELECT 1 FROM routines LIMIT 1")).rejects.toThrow();
    await expect(db.query("SELECT 1 FROM settings LIMIT 1")).rejects.toThrow();

    // After down, inserting with old v1-only columns should work (no NOT NULL on started_at)
    const now = new Date().toISOString();
    await db.exec(`
      INSERT INTO journal_entries (id, name, payload, created_at, updated_at)
      VALUES ('after-down', 'any-name', '{}', '${now}', '${now}')
    `);
    const result = await db.query<{ id: string }>("SELECT id FROM journal_entries WHERE id = 'after-down'");
    expect(result.rows).toHaveLength(1);
  });
});
