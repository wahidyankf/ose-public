import { describe, it, expect } from "vitest";
import { createActor, waitFor } from "xstate";
import { Effect, Layer } from "effect";
import { PGlite } from "@electric-sql/pglite";
import { PgliteService, makeJournalRuntime } from "@/lib/journal/runtime";
import { runMigrations } from "@/lib/journal/run-migrations";
import { journalMachine } from "./journal-machine";
import { Schema } from "effect";
import { EntryName, EntryPayload } from "../domain/schema";
import { StorageUnavailable } from "../domain/errors";

function makeTestRuntime() {
  const testLayer = Layer.scoped(
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
  return makeJournalRuntime(testLayer);
}

const makeName = (s: string) => Schema.decodeUnknownSync(EntryName)(s);
const makePayload = (obj: Record<string, unknown>) => Schema.decodeUnknownSync(EntryPayload)(obj);
const makeTs = () => new Date().toISOString() as unknown as import("@/contexts/journal/domain/schema").IsoTimestamp;

describe("journalMachine", () => {
  it("starts in initializing state", () => {
    const runtime = makeTestRuntime();
    const actor = createActor(journalMachine, {
      input: { runtime },
    });

    expect(actor.getSnapshot().value).toBe("initializing");
    void runtime.dispose();
  });

  it("transitions to ready.idle after successful init", async () => {
    const runtime = makeTestRuntime();
    const actor = createActor(journalMachine, {
      input: { runtime },
    });

    actor.start();

    await waitFor(actor, (state) => state.matches({ ready: "idle" }), {
      timeout: 10000,
    });

    expect(actor.getSnapshot().matches({ ready: "idle" })).toBe(true);

    actor.stop();
    await runtime.dispose();
  });

  it("sends ADD_BATCH and transitions through mutating then back to idle", async () => {
    const runtime = makeTestRuntime();
    const actor = createActor(journalMachine, {
      input: { runtime },
    });

    actor.start();

    await waitFor(actor, (state) => state.matches({ ready: "idle" }), {
      timeout: 10000,
    });

    const ts = makeTs();
    actor.send({
      type: "ADD_BATCH",
      inputs: [
        {
          name: makeName("workout"),
          payload: makePayload({ reps: 5 }),
          startedAt: ts,
          finishedAt: ts,
          labels: [] as const,
        },
      ],
    });

    // May pass through mutating quickly; that's OK
    await waitFor(actor, (state) => state.matches({ ready: "mutating" }), {
      timeout: 10000,
    }).catch(() => {});

    await waitFor(actor, (state) => state.matches({ ready: "idle" }), {
      timeout: 10000,
    });

    const snapshot = actor.getSnapshot();
    expect(snapshot.context.entries.length).toBeGreaterThan(0);
    expect(snapshot.context.entries[0]?.name).toBe("workout");

    actor.stop();
    await runtime.dispose();
  });

  it("buffers ADD_BATCH sent during mutating and processes both entries", async () => {
    // This tests the core bug fix: adding the same (or different) name twice
    // in rapid succession must result in BOTH entries being stored, not just one.
    const runtime = makeTestRuntime();
    const actor = createActor(journalMachine, {
      input: { runtime },
    });

    actor.start();

    await waitFor(actor, (state) => state.matches({ ready: "idle" }), {
      timeout: 10000,
    });

    // Send first ADD_BATCH — machine transitions to mutating
    const ts1 = makeTs();
    actor.send({
      type: "ADD_BATCH",
      inputs: [
        { name: makeName("workout"), payload: makePayload({}), startedAt: ts1, finishedAt: ts1, labels: [] as const },
      ],
    });

    // Send second ADD_BATCH immediately — machine is in mutating, should buffer it
    const ts2 = makeTs();
    actor.send({
      type: "ADD_BATCH",
      inputs: [
        {
          name: makeName("workout"),
          payload: makePayload({ session: 2 }),
          startedAt: ts2,
          finishedAt: ts2,
          labels: [] as const,
        },
      ],
    });

    // Wait for machine to process both mutations and return to idle
    await waitFor(actor, (state) => state.matches({ ready: "idle" }) && state.context.entries.length >= 2, {
      timeout: 15000,
    });

    const entries = actor.getSnapshot().context.entries;
    expect(entries.length).toBe(2);
    // Both entries have name "workout"
    expect(entries.every((e) => e.name === "workout")).toBe(true);
    // Entries have different IDs (different rows)
    expect(entries[0]?.id).not.toBe(entries[1]?.id);

    actor.stop();
    await runtime.dispose();
  });

  it("buffers different mutation events during mutating", async () => {
    // Add first entry, then immediately try to add a differently-named second entry.
    const runtime = makeTestRuntime();
    const actor = createActor(journalMachine, {
      input: { runtime },
    });

    actor.start();

    await waitFor(actor, (state) => state.matches({ ready: "idle" }), {
      timeout: 10000,
    });

    const ts3 = makeTs();
    actor.send({
      type: "ADD_BATCH",
      inputs: [
        { name: makeName("reading"), payload: makePayload({}), startedAt: ts3, finishedAt: ts3, labels: [] as const },
      ],
    });

    // Immediately buffer another mutation
    const ts4 = makeTs();
    actor.send({
      type: "ADD_BATCH",
      inputs: [
        { name: makeName("learning"), payload: makePayload({}), startedAt: ts4, finishedAt: ts4, labels: [] as const },
      ],
    });

    await waitFor(actor, (state) => state.matches({ ready: "idle" }) && state.context.entries.length >= 2, {
      timeout: 15000,
    });

    const entries = actor.getSnapshot().context.entries;
    expect(entries.length).toBe(2);
    const names = entries.map((e) => e.name).sort();
    expect(names).toEqual(["learning", "reading"]);

    actor.stop();
    await runtime.dispose();
  });

  it("lands in error state when loadEntries fails", async () => {
    const failingLayer = Layer.scoped(
      PgliteService,
      Effect.acquireRelease(
        Effect.tryPromise({
          try: async () => {
            const db = {
              query: () => Promise.reject(new Error("DB unavailable")),
              exec: () => Promise.reject(new Error("DB unavailable")),
              transaction: () => Promise.reject(new Error("DB unavailable")),
              close: () => Promise.resolve(),
            } as unknown as PGlite;
            return { db };
          },
          catch: (cause) => new StorageUnavailable({ cause }),
        }),
        ({ db }) => Effect.promise(() => db.close()),
      ),
    );

    const runtime = makeJournalRuntime(failingLayer);
    const actor = createActor(journalMachine, {
      input: { runtime },
    });

    actor.start();

    await waitFor(actor, (state) => state.matches("error"), {
      timeout: 10000,
    });

    expect(actor.getSnapshot().matches("error")).toBe(true);

    actor.stop();
    await runtime.dispose();
  });
});
