import { MIGRATIONS } from "./migrations/index.generated";
import type { PGlite } from "@electric-sql/pglite";

export async function runMigrations(db: PGlite): Promise<void> {
  await db.exec(
    "CREATE TABLE IF NOT EXISTS _migrations (id TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())",
  );
  const applied = new Set((await db.query<{ id: string }>("SELECT id FROM _migrations")).rows.map((r) => r.id));
  for (const m of MIGRATIONS) {
    if (applied.has(m.id)) continue;
    await db.transaction(async (tx) => {
      await m.up(tx);
      await tx.query("INSERT INTO _migrations(id) VALUES($1)", [m.id]);
    });
  }
}
