import { layer } from "@effect/vitest";
import { Effect, Layer, Schema } from "effect";
import { PGlite } from "@electric-sql/pglite";
import { PgliteService } from "./runtime";
import { runMigrations } from "./run-migrations";
import { appendEntries, listEntries, updateEntry, deleteEntry, bumpEntry, clearEntries } from "./journal-store";
import { EntryId, EntryName, EntryPayload } from "./schema";
import { EmptyBatch, NotFound } from "./errors";
import { expect } from "vitest";

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
const makePayload = (obj: Record<string, unknown>) => Schema.decodeUnknownSync(EntryPayload)(obj);
const makeTs = () => new Date().toISOString() as unknown as import("./schema").IsoTimestamp;

layer(TestPgliteLayer)("journal-store - appendEntries", (it) => {
  it.effect("returns EmptyBatch error on empty input", () =>
    Effect.gen(function* () {
      const result = yield* Effect.either(appendEntries([]));
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(EmptyBatch);
      }
    }),
  );

  it.effect("appends entries and returns them", () =>
    Effect.gen(function* () {
      yield* clearEntries();
      const ts = makeTs();
      const entries = yield* appendEntries([
        {
          name: makeName("workout"),
          payload: makePayload({ reps: 5 }),
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
      ]);
      expect(entries).toHaveLength(2);
      expect(entries[0]?.name).toBe("workout");
      expect(entries[1]?.name).toBe("meal");
      expect(entries[0]?.id).toBeTruthy();
      expect(entries[0]?.createdAt).toBeTruthy();
    }),
  );
});

layer(TestPgliteLayer)("journal-store - listEntries", (it) => {
  it.effect(
    "returns entries ordered by created_at DESC",
    () =>
      Effect.gen(function* () {
        yield* clearEntries();

        const ts1 = makeTs();
        yield* appendEntries([
          { name: makeName("reading"), payload: makePayload({}), startedAt: ts1, finishedAt: ts1, labels: [] as const },
        ]);

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

        const entries = yield* listEntries();
        expect(entries.length).toBeGreaterThanOrEqual(2);
        expect(entries[0]?.name).toBe("learning");
        expect(entries[1]?.name).toBe("reading");
      }),
    { timeout: 10000 },
  );
});

layer(TestPgliteLayer)("journal-store - updateEntry", (it) => {
  it.effect("updates entry name", () =>
    Effect.gen(function* () {
      yield* clearEntries();
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
      const updated = yield* updateEntry(id, {
        name: makeName("meal"),
      });
      expect(updated.name).toBe("meal");
      expect(updated.payload).toEqual({ x: 1 });
    }),
  );

  it.effect("returns NotFound for missing entry", () =>
    Effect.gen(function* () {
      const id = Schema.decodeUnknownSync(EntryId)("non-existent-id");
      const result = yield* Effect.either(updateEntry(id, { name: makeName("workout") }));
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(NotFound);
      }
    }),
  );
});

layer(TestPgliteLayer)("journal-store - deleteEntry", (it) => {
  it.effect("deletes existing entry and returns true", () =>
    Effect.gen(function* () {
      yield* clearEntries();
      const ts = makeTs();
      const appended = yield* appendEntries([
        { name: makeName("focus"), payload: makePayload({}), startedAt: ts, finishedAt: ts, labels: [] as const },
      ]);
      const entry = appended[0];
      if (!entry) throw new Error("Expected entry");
      const id = Schema.decodeUnknownSync(EntryId)(entry.id);
      const deleted = yield* deleteEntry(id);
      expect(deleted).toBe(true);
    }),
  );

  it.effect("returns false for non-existent entry", () =>
    Effect.gen(function* () {
      const id = Schema.decodeUnknownSync(EntryId)("ghost-id");
      const deleted = yield* deleteEntry(id);
      expect(deleted).toBe(false);
    }),
  );
});

layer(TestPgliteLayer)("journal-store - bumpEntry", (it) => {
  it.effect(
    "bumps entry to top of list",
    () =>
      Effect.gen(function* () {
        yield* clearEntries();

        const ts1 = makeTs();
        const appendedOlder = yield* appendEntries([
          { name: makeName("reading"), payload: makePayload({}), startedAt: ts1, finishedAt: ts1, labels: [] as const },
        ]);
        const older = appendedOlder[0];
        if (!older) throw new Error("Expected entry");

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
        yield* bumpEntry(olderId);

        const entries = yield* listEntries();
        expect(entries[0]?.name).toBe("reading");
      }),
    { timeout: 10000 },
  );

  it.effect("returns NotFound for non-existent entry", () =>
    Effect.gen(function* () {
      const id = Schema.decodeUnknownSync(EntryId)("ghost-id-2");
      const result = yield* Effect.either(bumpEntry(id));
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(NotFound);
      }
    }),
  );
});

layer(TestPgliteLayer)("journal-store - clearEntries", (it) => {
  it.effect("removes all entries", () =>
    Effect.gen(function* () {
      const ts = makeTs();
      yield* appendEntries([
        { name: makeName("workout"), payload: makePayload({}), startedAt: ts, finishedAt: ts, labels: [] as const },
        { name: makeName("meal"), payload: makePayload({}), startedAt: ts, finishedAt: ts, labels: [] as const },
      ]);

      yield* clearEntries();

      const entries = yield* listEntries();
      expect(entries).toHaveLength(0);
    }),
  );
});
