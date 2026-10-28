import type { Page } from "@playwright/test";

type BrowserJournalDb = {
  exec: (sql: string) => Promise<Array<{ rows: Array<Record<string, unknown>> }>>;
  query: (sql: string, params: unknown[]) => Promise<{ rows: Array<Record<string, unknown>> }>;
};

async function waitForJournalDb(page: Page): Promise<void> {
  await page.waitForFunction(() => Boolean((globalThis as { __ol_db?: unknown }).__ol_db), undefined, {
    timeout: 15000,
    polling: 100,
  });
}

export async function clearJournalEntries(page: Page): Promise<void> {
  await waitForJournalDb(page);
  await page.evaluate(async () => {
    const db = (globalThis as { __ol_db?: BrowserJournalDb }).__ol_db;
    if (!db) throw new Error("OrganicLever journal database was not initialized");
    await db.exec("DELETE FROM journal_entries");
  });
}

export async function seedHomeJournalEntries(page: Page): Promise<void> {
  await clearJournalEntries(page);
  await page.evaluate(async () => {
    const db = (globalThis as { __ol_db?: BrowserJournalDb }).__ol_db;
    if (!db) throw new Error("OrganicLever journal database was not initialized");
    const rows = [
      {
        id: "e2e-home-workout",
        name: "workout",
        payload: { routineName: "Kettlebell day", durationSecs: 2400, exercises: [] },
        timestamp: "2026-09-05T03:00:00.000Z",
      },
      {
        id: "e2e-home-reading",
        name: "reading",
        payload: { title: "Atomic Habits", author: "James Clear", pages: 320, durationMins: 45 },
        timestamp: "2026-09-04T03:00:00.000Z",
      },
    ];
    for (const row of rows) {
      await db.query(
        `INSERT INTO journal_entries
          (id, name, payload, labels, started_at, finished_at, created_at, updated_at)
         VALUES ($1, $2, $3::jsonb, '{}'::text[], $4, $4, $4, $4)`,
        [row.id, row.name, JSON.stringify(row.payload), row.timestamp],
      );
    }
  });
}

export async function seedWorkoutProgress(page: Page): Promise<void> {
  await waitForJournalDb(page);
  await page.evaluate(async () => {
    const db = (globalThis as { __ol_db?: BrowserJournalDb }).__ol_db;
    if (!db) throw new Error("OrganicLever journal database was not initialized");
    const timestamp = new Date().toISOString();
    await db.query(
      `INSERT INTO journal_entries
        (id, name, payload, labels, started_at, finished_at, created_at, updated_at)
       VALUES ($1, $2, $3::jsonb, '{}'::text[], $4, $4, $4, $4)`,
      [
        "e2e-progress-workout",
        "workout",
        JSON.stringify({
          routineName: "E2E Strength",
          durationSecs: 600,
          exercises: [{ name: "Squat", sets: [{ reps: 5, weight: "80 kg" }] }],
        }),
        timestamp,
      ],
    );
  });
}

export async function journalEntryCount(page: Page, name: string, expectedPayloadText: string): Promise<number> {
  await waitForJournalDb(page);
  return page.evaluate(
    async ({ entryName, payloadText }) => {
      const db = (globalThis as { __ol_db?: BrowserJournalDb }).__ol_db;
      if (!db) throw new Error("OrganicLever journal database was not initialized");
      const result = await db.query(
        "SELECT COUNT(*)::int AS count FROM journal_entries WHERE name = $1 AND payload::text LIKE $2",
        [entryName, `%${payloadText}%`],
      );
      return Number(result.rows[0]?.["count"] ?? 0);
    },
    { entryName: name, payloadText: expectedPayloadText },
  );
}
