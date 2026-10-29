import { describe, expect, it } from "vitest";

import {
  PROGRESS_KEY,
  RESET_CONTROL_ID,
  claimProgressIsland,
  clearRecord,
  completedInCourse,
  confirmReset,
  courseCompletedCount,
  createBlockedStore,
  emptyRecord,
  isValidPageID,
  isValidRecord,
  loadRecord,
  markComplete,
  markIncomplete,
  requestCarriesProgress,
  saveRecord,
  serializeRecord,
  subscribeCrossTab,
  wireResetControl,
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

describe("browser progress v1 contract (P2)", () => {
  it("accepts course/lesson page identities and rejects unsafe ones", () => {
    expect(isValidPageID("go-basics/hello-world")).toBe(true);
    for (const bad of ["", "no-slash", "/lead", "trail/", "a/b/c", "../x", "a/../b", "UPPER/x", "has space/x"]) {
      expect(isValidPageID(bad)).toBe(false);
    }
  });

  it("rejects completion for an invalid page identity", () => {
    const done = markComplete(emptyRecord(), "../escape");
    expect(done.completed).toEqual([]);
  });

  it("keeps completion idempotent without duplicating entries", () => {
    const once = markComplete(emptyRecord(), "go-basics/hello-world");
    expect(markComplete(once, "go-basics/hello-world").completed).toEqual(["go-basics/hello-world"]);
  });

  it("rejects records that break the exact v1 bounds", () => {
    const tooLong = "x".repeat(513);
    expect(isValidRecord({ version: 1, completed: [tooLong], lastPath: "", lastCourse: "" })).toBe(false);
    expect(isValidRecord({ version: 1, completed: [], lastPath: tooLong, lastCourse: "" })).toBe(false);
    expect(isValidRecord({ version: 1, completed: [], lastPath: "", lastCourse: tooLong })).toBe(false);
    expect(isValidRecord({ version: 2, completed: [], lastPath: "", lastCourse: "" })).toBe(false);
    expect(
      isValidRecord({ version: 1, completed: new Array(2001).fill("go-basics/x"), lastPath: "", lastCourse: "" }),
    ).toBe(false);
  });

  it("serializes deterministically regardless of completion order", () => {
    const first = markComplete(markComplete(emptyRecord(), "go-basics/b"), "go-basics/a");
    const second = markComplete(markComplete(emptyRecord(), "go-basics/a"), "go-basics/b");
    expect(serializeRecord(first)).toBe(serializeRecord(second));
  });

  it("keeps visit progress with a notice when storage is blocked", () => {
    const blocked = createBlockedStore();
    const record = loadRecord(blocked.read);
    expect(record).toEqual(emptyRecord());
    saveRecord(blocked.write, markComplete(record, "go-basics/hello-world"));
    expect(loadRecord(blocked.read).completed).toEqual(["go-basics/hello-world"]);
    expect(blocked.notice().length).toBeGreaterThan(0);
  });

  it("recovers an invalid record to a valid v1 replacement", () => {
    const storage = memoryStorage({ [PROGRESS_KEY]: "not-json{" });
    expect(loadRecord(storage.read)).toEqual(emptyRecord());
    saveRecord(storage.write, markComplete(loadRecord(storage.read), "go-basics/setup"));
    const reloaded = loadRecord(storage.read);
    expect(reloaded.completed).toEqual(["go-basics/setup"]);
    expect(isValidRecord(reloaded)).toBe(true);
  });

  it("clears progress only when the reader confirms reset", () => {
    const storage = memoryStorage({ [PROGRESS_KEY]: '{"version":1}', theme: "dark" });
    expect(confirmReset(false, storage.remove)).toBe(false);
    expect(storage.snapshot()[PROGRESS_KEY]).toBe('{"version":1}');
    expect(confirmReset(true, storage.remove)).toBe(true);
    expect(storage.snapshot()).toEqual({ theme: "dark" });
    expect(RESET_CONTROL_ID).toBe("reset-control");
  });

  it("updates the other tab without reloading on storage events", () => {
    const shared = memoryStorage();
    const listeners = new Set<(key: string | null) => void>();
    let second = loadRecord(shared.read);
    subscribeCrossTab(
      (listener) => {
        listeners.add(listener);
      },
      () => loadRecord(shared.read),
      (record) => {
        second = record;
      },
    );
    saveRecord(shared.write, markComplete(loadRecord(shared.read), "go-basics/hello-world"));
    for (const listener of listeners) listener(PROGRESS_KEY);
    expect(second.completed).toEqual(["go-basics/hello-world"]);
    for (const listener of listeners) listener("theme");
    expect(second.completed).toEqual(["go-basics/hello-world"]);
  });

  it("claims the progress island once across htmx re-initialization", () => {
    const element = { dataset: {} as Record<string, string | undefined> };
    expect(claimProgressIsland(element)).toBe(true);
    expect(claimProgressIsland(element)).toBe(false);
  });

  it("never carries the progress record in a request", () => {
    expect(requestCarriesProgress("/en/learn/go-basics/hello-world")).toBe(false);
    expect(requestCarriesProgress("/htmx/search?q=golang&limit=20", "")).toBe(false);
    expect(requestCarriesProgress("/en/learn/go-basics", JSON.stringify({ completed: ["x"] }))).toBe(true);
    expect(requestCarriesProgress("/en", PROGRESS_KEY)).toBe(true);
  });

  it("keeps completion at the course level across paths", () => {
    let record = emptyRecord();
    record = markComplete(record, "go-basics/setup");
    record = markComplete(record, "go-basics/hello-world");
    record = { ...record, lastPath: "backend-id", lastCourse: "go-basics" };
    const reopened = { ...record, lastPath: "other-path" };
    expect(completedInCourse(reopened, "go-basics")).toEqual(["go-basics/hello-world", "go-basics/setup"]);
    expect(courseCompletedCount(reopened, "go-basics")).toBe(2);
    expect(courseCompletedCount(reopened, "go-web")).toBe(0);
    expect(markIncomplete(reopened, "go-basics/setup").completed).toEqual(["go-basics/hello-world"]);
  });
});

describe("reset control wiring", () => {
  function harness(confirmed: boolean) {
    const removed: string[] = [];
    const notices: string[] = [];
    let focused = 0;
    const wired = wireResetControl(
      {
        focus: () => {
          focused += 1;
        },
      },
      {
        setText: (message: string) => {
          notices.push(message);
        },
      },
      {
        confirmDialog: () => confirmed,
        remove: (key: string) => {
          removed.push(key);
        },
      },
    );
    return { wired, removed, notices, focused: () => focused };
  }

  it("clears only the progress key, announces, and refocuses on confirm", () => {
    const { wired, removed, notices, focused } = harness(true);
    expect(wired).toBe(true);
    expect(removed).toEqual([PROGRESS_KEY]);
    expect(notices).toEqual(["Progress reset."]);
    expect(focused()).toBe(1);
  });

  it("keeps the record and still refocuses on cancel", () => {
    let focused = 0;
    const removed: string[] = [];
    const wired = wireResetControl(
      {
        focus: () => {
          focused += 1;
        },
      },
      {
        setText: () => {
          throw new Error("must not announce on cancel");
        },
      },
      {
        confirmDialog: () => false,
        remove: (key: string) => {
          removed.push(key);
        },
      },
    );
    expect(wired).toBe(true);
    expect(removed).toEqual([]);
    expect(focused).toBe(1);
  });

  it("reports a missing reset control without touching storage", () => {
    let called = false;
    expect(
      wireResetControl(null, null, {
        confirmDialog: () => {
          called = true;
          return true;
        },
        remove: () => {
          called = true;
        },
      }),
    ).toBe(false);
    expect(called).toBe(false);
  });
});
