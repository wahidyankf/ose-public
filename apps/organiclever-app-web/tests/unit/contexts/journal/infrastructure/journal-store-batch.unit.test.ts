/* oxlint-disable vitest/no-standalone-expect -- @effect/vitest it.effect blocks inside layer() are not recognised as test blocks */
import { layer } from "@effect/vitest";
import { Effect, Layer, Schema } from "effect";
import { PGlite } from "@electric-sql/pglite";
import { afterEach, beforeEach, expect } from "vitest";
import { EntryName, EntryPayload } from "../../../../../src/contexts/journal/domain/schema";
import { appendEntries, listEntries } from "../../../../../src/contexts/journal/infrastructure/journal-store";
import { runMigrations } from "../../../../../src/contexts/journal/infrastructure/run-migrations";
import { PgliteService } from "../../../../../src/contexts/journal/infrastructure/runtime";
import { FIXED_INSTANT, FIXED_MS, freezeClock, restoreClock, setClock } from "../../../support/doubles";

beforeEach(() => freezeClock());
afterEach(() => restoreClock());

const TestPgliteLayer = Layer.scoped(
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

const makeName = (value: string) => Schema.decodeUnknownSync(EntryName)(value);
const makePayload = (value: Record<string, unknown>) => value as unknown as typeof EntryPayload.Type;
const makeTimestamp = () =>
  FIXED_INSTANT as unknown as import("../../../../../src/contexts/journal/domain/schema").IsoTimestamp;
const resetEntries = Effect.gen(function* () {
  const { db } = yield* PgliteService;
  yield* Effect.promise(() => db.exec("TRUNCATE journal_entries RESTART IDENTITY"));
});

layer(TestPgliteLayer)("journal-store integration tests", (it) => {
  it.effect("migration idempotency — running twice keeps _migrations row count at 2", () =>
    Effect.gen(function* () {
      const { db } = yield* PgliteService;
      yield* Effect.promise(() => runMigrations(db));
      const result = yield* Effect.promise(() => db.query<{ id: string }>("SELECT id FROM _migrations"));
      expect(result.rows).toHaveLength(2);
    }),
  );

  it.effect("appendEntries batch atomicity — 3 entries share identical createdAt and listEntries returns 3 rows", () =>
    Effect.gen(function* () {
      yield* resetEntries;
      const timestamp = makeTimestamp();
      const entries = yield* appendEntries([
        {
          name: makeName("workout"),
          payload: makePayload({ reps: 12 }),
          startedAt: timestamp,
          finishedAt: timestamp,
          labels: [] as const,
        },
        {
          name: makeName("meal"),
          payload: makePayload({ calories: 500 }),
          startedAt: timestamp,
          finishedAt: timestamp,
          labels: [] as const,
        },
        {
          name: makeName("reading"),
          payload: makePayload({ pages: 20 }),
          startedAt: timestamp,
          finishedAt: timestamp,
          labels: [] as const,
        },
      ]);

      expect(entries).toHaveLength(3);
      expect(entries[0]?.createdAt).toBe(entries[1]?.createdAt);
      expect(entries[1]?.createdAt).toBe(entries[2]?.createdAt);
      expect(yield* listEntries()).toHaveLength(3);
    }),
  );

  it.effect("sort tiebreaker — same-timestamp batch comes back in input order (storage_seq ASC)", () =>
    Effect.gen(function* () {
      yield* resetEntries;
      const timestamp = makeTimestamp();
      yield* appendEntries([
        {
          name: makeName("workout"),
          payload: makePayload({}),
          startedAt: timestamp,
          finishedAt: timestamp,
          labels: [] as const,
        },
        {
          name: makeName("reading"),
          payload: makePayload({}),
          startedAt: timestamp,
          finishedAt: timestamp,
          labels: [] as const,
        },
        {
          name: makeName("learning"),
          payload: makePayload({}),
          startedAt: timestamp,
          finishedAt: timestamp,
          labels: [] as const,
        },
      ]);

      expect((yield* listEntries()).map((entry) => entry.name)).toEqual(["workout", "reading", "learning"]);
    }),
  );

  it.effect(
    "cross-batch ordering — entries from later batch appear before earlier batch in listEntries",
    () =>
      Effect.gen(function* () {
        yield* resetEntries;
        const firstTimestamp = makeTimestamp();
        yield* appendEntries([
          {
            name: makeName("reading"),
            payload: makePayload({}),
            startedAt: firstTimestamp,
            finishedAt: firstTimestamp,
            labels: [] as const,
          },
        ]);
        yield* Effect.sync(() => setClock(FIXED_MS + 10));
        const secondTimestamp = makeTimestamp();
        yield* appendEntries([
          {
            name: makeName("learning"),
            payload: makePayload({}),
            startedAt: secondTimestamp,
            finishedAt: secondTimestamp,
            labels: [] as const,
          },
        ]);

        expect((yield* listEntries()).map((entry) => entry.name)).toEqual(["learning", "reading"]);
      }),
    { timeout: 15000 },
  );

  it.effect("stats SQL — count per name matches inserted fixture data", () =>
    Effect.gen(function* () {
      yield* resetEntries;
      const { db } = yield* PgliteService;
      const timestamp = makeTimestamp();
      yield* appendEntries([
        {
          name: makeName("workout"),
          payload: makePayload({ reps: 10 }),
          startedAt: timestamp,
          finishedAt: timestamp,
          labels: [] as const,
        },
        {
          name: makeName("workout"),
          payload: makePayload({ reps: 15 }),
          startedAt: timestamp,
          finishedAt: timestamp,
          labels: [] as const,
        },
        {
          name: makeName("reading"),
          payload: makePayload({ pages: 30 }),
          startedAt: timestamp,
          finishedAt: timestamp,
          labels: [] as const,
        },
      ]);

      type StatRow = { name: string; entry_count: string };
      const result = yield* Effect.promise(() =>
        db.query<StatRow>(
          `SELECT name, COUNT(*)::text AS entry_count
           FROM journal_entries
           GROUP BY name
           ORDER BY name`,
        ),
      );
      const stats = Object.fromEntries(result.rows.map((row) => [row.name, Number.parseInt(row.entry_count, 10)]));

      expect(stats["workout"]).toBe(2);
      expect(stats["reading"]).toBe(1);
    }),
  );
});
