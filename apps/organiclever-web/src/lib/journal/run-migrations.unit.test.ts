import { describe, it, expect } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { runMigrations } from "./run-migrations";
import type { Migration } from "./migrations/index.generated";

async function createFreshDb(): Promise<PGlite> {
  return new PGlite();
}

describe("runMigrations", () => {
  it("applies migrations to a fresh DB", async () => {
    const db = await createFreshDb();
    try {
      await runMigrations(db);
      const result = await db.query<{ id: string }>("SELECT id FROM _migrations");
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]?.id).toBe("2026_04_28T14_05_30__create_journal_entries_table");
    } finally {
      await db.close();
    }
  });

  it("is idempotent — running twice does not duplicate rows", async () => {
    const db = await createFreshDb();
    try {
      await runMigrations(db);
      const beforeResult = await db.query<{
        id: string;
        applied_at: Date;
      }>("SELECT id, applied_at FROM _migrations");
      const appliedAtBefore = beforeResult.rows[0]?.applied_at;

      await runMigrations(db);
      const afterResult = await db.query<{
        id: string;
        applied_at: Date;
      }>("SELECT id, applied_at FROM _migrations");

      expect(afterResult.rows).toHaveLength(1);
      expect(afterResult.rows[0]?.applied_at).toEqual(appliedAtBefore);
    } finally {
      await db.close();
    }
  });

  it("rolls back failing migration — _migrations unchanged, table absent", async () => {
    const db = await createFreshDb();
    try {
      // Create the _migrations table first (simulating prior state with no migrations applied)
      await db.exec(
        "CREATE TABLE IF NOT EXISTS _migrations (id TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())",
      );

      const failingMigration: Migration = {
        id: "failing-migration",
        up: async () => {
          throw new Error("Intentional failure");
        },
      };

      // Patch MIGRATIONS temporarily via a custom run function
      async function runCustomMigrations(migrations: Migration[]): Promise<void> {
        const applied = new Set((await db.query<{ id: string }>("SELECT id FROM _migrations")).rows.map((r) => r.id));
        for (const m of migrations) {
          if (applied.has(m.id)) continue;
          await db.transaction(async (tx) => {
            await m.up(tx);
            await tx.query("INSERT INTO _migrations(id) VALUES($1)", [m.id]);
          });
        }
      }

      await expect(runCustomMigrations([failingMigration])).rejects.toThrow("Intentional failure");

      const result = await db.query<{ id: string }>("SELECT id FROM _migrations");
      expect(result.rows).toHaveLength(0);

      // Verify journal_entries table does NOT exist from this failed migration
      await expect(db.query("SELECT * FROM journal_entries")).rejects.toThrow();
    } finally {
      await db.close();
    }
  });

  it("two migrations sequence — second fails, first stays applied", async () => {
    const db = await createFreshDb();
    try {
      await db.exec(
        "CREATE TABLE IF NOT EXISTS _migrations (id TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())",
      );

      let firstApplied = false;

      const firstMigration: Migration = {
        id: "first-migration",
        up: async (queryable) => {
          await queryable.exec("CREATE TABLE IF NOT EXISTS test_table_first (id TEXT PRIMARY KEY)");
          firstApplied = true;
        },
      };

      const secondMigration: Migration = {
        id: "second-migration",
        up: async () => {
          throw new Error("Second migration fails");
        },
      };

      async function runCustomMigrations(migrations: Migration[]): Promise<void> {
        const applied = new Set((await db.query<{ id: string }>("SELECT id FROM _migrations")).rows.map((r) => r.id));
        for (const m of migrations) {
          if (applied.has(m.id)) continue;
          await db.transaction(async (tx) => {
            await m.up(tx);
            await tx.query("INSERT INTO _migrations(id) VALUES($1)", [m.id]);
          });
        }
      }

      // First migration succeeds
      await runCustomMigrations([firstMigration]);
      expect(firstApplied).toBe(true);

      // Second migration fails
      await expect(runCustomMigrations([firstMigration, secondMigration])).rejects.toThrow("Second migration fails");

      // First still applied
      const result = await db.query<{ id: string }>("SELECT id FROM _migrations");
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]?.id).toBe("first-migration");

      // Second not applied
      const noSecond = result.rows.find((r) => r.id === "second-migration");
      expect(noSecond).toBeUndefined();
    } finally {
      await db.close();
    }
  });
});
