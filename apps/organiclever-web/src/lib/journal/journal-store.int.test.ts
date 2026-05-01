import { layer } from "@effect/vitest";
import { Cause, Effect, Exit, Layer, Schema } from "effect";
import { PGlite } from "@electric-sql/pglite";
import { expect } from "vitest";
import { PgliteService } from "./runtime";
import { runMigrations } from "./run-migrations";
import { appendEntries, bumpEntry, clearEntries, deleteEntry, listEntries, updateEntry } from "./journal-store";
import { NotFound } from "./errors";
import { EntryId, EntryName, EntryPayload } from "./schema";

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

const makeName = (s: string) => Schema.decodeUnknownSync(EntryName)(s);
const makePayload = (obj: Record<string, unknown>) => obj as unknown as typeof EntryPayload.Type;
const makeTs = () => new Date().toISOString() as unknown as import("./schema").IsoTimestamp;
const missingId = "00000000-0000-0000-0000-000000000000" as unknown as EntryId;

layer(TestPgliteLayer)("journal-store integration tests", (it) => {
  // Test 1: Migration idempotency
  it.effect("migration idempotency — running twice keeps _migrations row count at 2", () =>
    Effect.gen(function* () {
      const { db } = yield* PgliteService;
      yield* Effect.promise(() => runMigrations(db));
      const result = yield* Effect.promise(() => db.query<{ id: string }>("SELECT id FROM _migrations"));
      expect(result.rows).toHaveLength(2);
    }),
  );

  // Test 2: Batch atomicity
  it.effect("appendEntries batch atomicity — 3 entries share identical createdAt and listEntries returns 3 rows", () =>
    Effect.gen(function* () {
      const ts = makeTs();
      const entries = yield* appendEntries([
        {
          name: makeName("workout"),
          payload: makePayload({ reps: 12 }),
          startedAt: ts,
          finishedAt: ts,
          labels: [] as const,
        },
        {
          name: makeName("meal"),
          payload: makePayload({ calories: 500 }),
          startedAt: ts,
          finishedAt: ts,
          labels: [] as const,
        },
        {
          name: makeName("reading"),
          payload: makePayload({ pages: 20 }),
          startedAt: ts,
          finishedAt: ts,
          labels: [] as const,
        },
      ]);

      expect(entries).toHaveLength(3);
      expect(entries[0]?.createdAt).toBe(entries[1]?.createdAt);
      expect(entries[1]?.createdAt).toBe(entries[2]?.createdAt);

      const all = yield* listEntries();
      expect(all).toHaveLength(3);
    }),
  );

  // Test 3: Sort tiebreaker within same batch
  it.effect("sort tiebreaker — same-timestamp batch comes back in input order (storage_seq ASC)", () =>
    Effect.gen(function* () {
      const ts = makeTs();
      const entries = yield* appendEntries([
        { name: makeName("workout"), payload: makePayload({}), startedAt: ts, finishedAt: ts, labels: [] as const },
        { name: makeName("reading"), payload: makePayload({}), startedAt: ts, finishedAt: ts, labels: [] as const },
        { name: makeName("learning"), payload: makePayload({}), startedAt: ts, finishedAt: ts, labels: [] as const },
      ]);
      expect(entries).toHaveLength(3);

      const all = yield* listEntries();
      // Same-timestamp entries must appear in insertion order (storage_seq ASC)
      const names = all.map((e) => e.name);
      const workoutIdx = names.indexOf(makeName("workout"));
      const readingIdx = names.indexOf(makeName("reading"));
      const learningIdx = names.indexOf(makeName("learning"));
      expect(workoutIdx).toBeGreaterThanOrEqual(0);
      expect(readingIdx).toBeGreaterThanOrEqual(0);
      expect(learningIdx).toBeGreaterThanOrEqual(0);
      expect(workoutIdx).toBeLessThan(readingIdx);
      expect(readingIdx).toBeLessThan(learningIdx);
    }),
  );

  // Test 4: Cross-batch ordering (later batch sorts first)
  it.effect(
    "cross-batch ordering — entries from later batch appear before earlier batch in listEntries",
    () =>
      Effect.gen(function* () {
        const ts1 = makeTs();
        const batch1 = yield* appendEntries([
          { name: makeName("reading"), payload: makePayload({}), startedAt: ts1, finishedAt: ts1, labels: [] as const },
        ]);
        const xEntry = batch1[0];
        if (!xEntry) throw new Error("Expected batch1 entry");

        // Small delay to ensure a different timestamp
        yield* Effect.promise(() => new Promise((r) => setTimeout(r, 10)));

        const ts2 = makeTs();
        const batch2 = yield* appendEntries([
          {
            name: makeName("learning"),
            payload: makePayload({}),
            startedAt: ts2,
            finishedAt: ts2,
            labels: [] as const,
          },
        ]);
        const yEntry = batch2[0];
        if (!yEntry) throw new Error("Expected batch2 entry");

        const all = yield* listEntries();
        const names = all.map((e) => e.name);
        const xIdx = names.indexOf(makeName("reading"));
        const yIdx = names.indexOf(makeName("learning"));
        expect(xIdx).toBeGreaterThanOrEqual(0);
        expect(yIdx).toBeGreaterThanOrEqual(0);
        // learning (later batch) should sort before reading (earlier batch)
        expect(yIdx).toBeLessThan(xIdx);
      }),
    { timeout: 15000 },
  );

  // Test 5: updateEntry preserves createdAt and advances updatedAt
  it.effect("updateEntry preserves createdAt and advances updatedAt", () =>
    Effect.gen(function* () {
      const ts = makeTs();
      const appended = yield* appendEntries([
        {
          name: makeName("workout"),
          payload: makePayload({ x: 1 }),
          startedAt: ts,
          finishedAt: ts,
          labels: [] as const,
        },
      ]);
      const entry = appended[0];
      if (!entry) throw new Error("Expected entry");

      const id = Schema.decodeUnknownSync(EntryId)(entry.id);
      const updated = yield* updateEntry(id, { name: makeName("meal") });

      expect(updated.createdAt).toBe(entry.createdAt);
      expect(updated.updatedAt >= entry.updatedAt).toBe(true);
    }),
  );

  // Test 6: updateEntry partial patch (COALESCE — name only, payload unchanged)
  it.effect("updateEntry partial patch — updating only name leaves payload unchanged (COALESCE)", () =>
    Effect.gen(function* () {
      const ts = makeTs();
      const appended = yield* appendEntries([
        {
          name: makeName("reading"),
          payload: makePayload({ key: "original-value" }),
          startedAt: ts,
          finishedAt: ts,
          labels: [] as const,
        },
      ]);
      const entry = appended[0];
      if (!entry) throw new Error("Expected entry");

      const id = Schema.decodeUnknownSync(EntryId)(entry.id);
      const updated = yield* updateEntry(id, { name: makeName("learning") });

      expect(updated.name).toBe("learning");
      expect(updated.payload).toEqual({ key: "original-value" });
    }),
  );

  // Test 7: updateEntry NotFound
  it.effect("updateEntry NotFound — missing id yields NotFound failure", () =>
    Effect.gen(function* () {
      const exit = yield* Effect.exit(updateEntry(missingId, { name: makeName("should-fail") }));
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit)) {
        const failure = Cause.failureOption(exit.cause);
        expect(failure._tag).toBe("Some");
        if (failure._tag === "Some") {
          expect(failure.value).toBeInstanceOf(NotFound);
          expect((failure.value as NotFound).id).toBe(missingId);
        }
      }
    }),
  );

  // Test 8: deleteEntry rowcount semantics
  it.effect("deleteEntry — returns true for existing entry, false for missing entry", () =>
    Effect.gen(function* () {
      const ts = makeTs();
      const appended = yield* appendEntries([
        { name: makeName("focus"), payload: makePayload({}), startedAt: ts, finishedAt: ts, labels: [] as const },
      ]);
      const entry = appended[0];
      if (!entry) throw new Error("Expected entry");

      const id = Schema.decodeUnknownSync(EntryId)(entry.id);
      const deletedExisting = yield* deleteEntry(id);
      expect(deletedExisting).toBe(true);

      const deletedMissing = yield* deleteEntry(missingId);
      expect(deletedMissing).toBe(false);
    }),
  );

  // Test 9: bumpEntry NotFound
  it.effect("bumpEntry NotFound — missing id yields NotFound failure", () =>
    Effect.gen(function* () {
      const exit = yield* Effect.exit(bumpEntry(missingId));
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit)) {
        const failure = Cause.failureOption(exit.cause);
        expect(failure._tag).toBe("Some");
        if (failure._tag === "Some") {
          expect(failure.value).toBeInstanceOf(NotFound);
        }
      }
    }),
  );

  // Test 10: bumpEntry mutates both timestamps
  it.effect(
    "bumpEntry mutates both createdAt and updatedAt, moves entry to top of list",
    () =>
      Effect.gen(function* () {
        const ts1 = makeTs();
        const olderBatch = yield* appendEntries([
          { name: makeName("reading"), payload: makePayload({}), startedAt: ts1, finishedAt: ts1, labels: [] as const },
        ]);
        const older = olderBatch[0];
        if (!older) throw new Error("Expected older entry");

        // Small delay so newer entry gets a distinct later timestamp
        yield* Effect.promise(() => new Promise((r) => setTimeout(r, 10)));

        const ts2 = makeTs();
        yield* appendEntries([
          {
            name: makeName("learning"),
            payload: makePayload({}),
            startedAt: ts2,
            finishedAt: ts2,
            labels: [] as const,
          },
        ]);

        const olderId = Schema.decodeUnknownSync(EntryId)(older.id);

        // Another delay before bump so bump timestamp is clearly later
        yield* Effect.promise(() => new Promise((r) => setTimeout(r, 10)));

        yield* bumpEntry(olderId);

        const all = yield* listEntries();
        expect(all[0]?.name).toBe("reading");

        const bumped = all[0];
        if (!bumped) throw new Error("Expected bumped entry");
        expect(bumped.createdAt > older.createdAt).toBe(true);
        expect(bumped.updatedAt > older.updatedAt).toBe(true);
      }),
    { timeout: 15000 },
  );

  // Test 11: clearEntries
  it.effect("clearEntries — listEntries returns empty array after clear", () =>
    Effect.gen(function* () {
      const ts = makeTs();
      yield* appendEntries([
        { name: makeName("workout"), payload: makePayload({}), startedAt: ts, finishedAt: ts, labels: [] as const },
        { name: makeName("meal"), payload: makePayload({}), startedAt: ts, finishedAt: ts, labels: [] as const },
      ]);

      yield* clearEntries();

      const all = yield* listEntries();
      expect(all).toHaveLength(0);
    }),
  );

  // Test 12: Stats SQL via raw db.query
  it.effect("stats SQL — count per name matches inserted fixture data", () =>
    Effect.gen(function* () {
      const { db } = yield* PgliteService;

      // Insert fixture: 2x "workout" and 1x "reading"
      const ts = makeTs();
      yield* appendEntries([
        {
          name: makeName("workout"),
          payload: makePayload({ reps: 10 }),
          startedAt: ts,
          finishedAt: ts,
          labels: [] as const,
        },
        {
          name: makeName("workout"),
          payload: makePayload({ reps: 15 }),
          startedAt: ts,
          finishedAt: ts,
          labels: [] as const,
        },
        {
          name: makeName("reading"),
          payload: makePayload({ pages: 30 }),
          startedAt: ts,
          finishedAt: ts,
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

      const stats = Object.fromEntries(result.rows.map((r) => [r.name, parseInt(r.entry_count, 10)]));

      expect(stats["workout"]).toBe(2);
      expect(stats["reading"]).toBe(1);
    }),
  );
});
