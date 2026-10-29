import { describe, expect, it } from "vitest";

import {
  PROGRESS_KEY,
  clearRecord,
  emptyRecord,
  isValidRecord,
  loadRecord,
  markComplete,
  markIncomplete,
  saveRecord,
} from "./progress";

function memoryStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial));
  return {
    read: (key: string) => (store.has(key) ? (store.get(key) as string) : null),
    write: (key: string, value: string) => {
      store.set(key, value);
    },
    remove: (key: string) => {
      store.delete(key);
    },
    snapshot: () => Object.fromEntries(store),
  };
}

describe("browser progress record (P1H stub)", () => {
  it("starts empty without saved progress", () => {
    expect(loadRecord(memoryStorage().read)).toEqual(emptyRecord());
  });

  it("keeps the version 1 schema after completion", () => {
    const storage = memoryStorage();
    const saved = markComplete(loadRecord(storage.read), "go-basics/hello-world");
    saveRecord(storage.write, saved);
    const reloaded = loadRecord(storage.read);
    expect(reloaded.completed).toContain("go-basics/hello-world");
    expect(isValidRecord(reloaded)).toBe(true);
  });

  it("recovers from an invalid record to a valid empty state", () => {
    const storage = memoryStorage({ [PROGRESS_KEY]: "not-json{" });
    const reloaded = loadRecord(storage.read);
    expect(reloaded).toEqual(emptyRecord());
    expect(isValidRecord(reloaded)).toBe(true);
  });

  it("undoes a completed page", () => {
    const done = markComplete(emptyRecord(), "go-basics/hello-world");
    expect(markIncomplete(done, "go-basics/hello-world").completed).toEqual([]);
  });

  it("clears only the progress key", () => {
    const storage = memoryStorage({ [PROGRESS_KEY]: "{}", theme: "dark" });
    clearRecord(storage.remove);
    expect(storage.snapshot()).toEqual({ theme: "dark" });
  });
});
