import { afterEach, describe, expect, it, vi } from "vitest";
import { PROGRESS_STORAGE_KEY, type ProgressState } from "@/features/learning-progress/core/progress-schema";
import { serializeProgress, setPageComplete } from "@/features/learning-progress/core/progress-state";
import {
  createProgressStore,
  learningProgressStore,
  type ProgressSnapshot,
} from "@/features/learning-progress/shell/progress-storage";

const EMPTY: ProgressState = { version: 1, completed: {}, lastPath: null, lastCourse: null };

function record(overrides: Partial<ProgressState> = {}): ProgressState {
  return { ...EMPTY, ...overrides };
}

function ready(snapshot: ProgressSnapshot): Extract<ProgressSnapshot, { status: "ready" }> {
  if (snapshot.status !== "ready") {
    throw new Error(`expected a ready snapshot, got ${snapshot.status}`);
  }
  return snapshot;
}

type ThrowableMethod = "getItem" | "setItem" | "removeItem";

/** A `Storage` stand-in whose methods can be told to throw, plus the raw map for cross-tab writes. */
function fakeStorage(initial: Record<string, string> = {}) {
  const entries = new Map<string, string>(Object.entries(initial));
  const control: { throwOn: ThrowableMethod | null } = { throwOn: null };

  const storage = {
    get length(): number {
      return entries.size;
    },
    clear(): void {
      entries.clear();
    },
    getItem(key: string): string | null {
      if (control.throwOn === "getItem") throw new DOMException("blocked", "SecurityError");
      return entries.has(key) ? (entries.get(key) as string) : null;
    },
    key(index: number): string | null {
      return [...entries.keys()][index] ?? null;
    },
    removeItem(key: string): void {
      if (control.throwOn === "removeItem") throw new DOMException("blocked", "SecurityError");
      entries.delete(key);
    },
    setItem(key: string, value: string): void {
      if (control.throwOn === "setItem") throw new DOMException("full", "QuotaExceededError");
      entries.set(key, value);
    },
  };

  return { control, entries, storage: storage as unknown as Storage };
}

describe("createProgressStore", () => {
  it("reads storage lazily and keeps the same snapshot object until a change", () => {
    const { storage } = fakeStorage({
      [PROGRESS_STORAGE_KEY]: serializeProgress(record({ completed: { "just-enough-bash": ["learning/overview"] } })),
    });
    const getStorage = vi.fn(() => storage);
    const store = createProgressStore(getStorage, null);

    expect(getStorage).not.toHaveBeenCalled();

    const first = store.getSnapshot();

    expect(getStorage).toHaveBeenCalledTimes(1);
    expect(first).toEqual({
      status: "ready",
      persisted: true,
      recovered: false,
      state: record({ completed: { "just-enough-bash": ["learning/overview"] } }),
    });
    expect(store.getSnapshot()).toBe(first);

    store.update((current) => record({ ...current, lastCourse: { courseId: "just-enough-bash" } }));

    expect(store.getSnapshot()).not.toBe(first);
  });

  it("notifies subscribers on update, and stops after the returned unsubscribe runs", () => {
    const { storage } = fakeStorage();
    const store = createProgressStore(() => storage, null);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.update((current) => setPageComplete(current, "just-enough-bash", "learning/overview", true));
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    store.update((current) => setPageComplete(current, "just-enough-bash", "drill/one", true));

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("switches to memory mode when no storage exists", () => {
    const store = createProgressStore(() => null, null);

    expect(store.getSnapshot()).toEqual({ status: "ready", persisted: false, recovered: false, state: EMPTY });
  });

  it("switches to memory mode when reading window.localStorage itself throws", () => {
    const store = createProgressStore(() => {
      throw new DOMException("blocked", "SecurityError");
    }, null);

    expect(store.getSnapshot()).toEqual({ status: "ready", persisted: false, recovered: false, state: EMPTY });
  });

  it("switches to memory mode when getItem throws, and keeps later changes in memory only", () => {
    const { control, entries, storage } = fakeStorage();
    control.throwOn = "getItem";
    const store = createProgressStore(() => storage, null);

    expect(store.getSnapshot()).toEqual({ status: "ready", persisted: false, recovered: false, state: EMPTY });

    store.update((current) => setPageComplete(current, "just-enough-bash", "learning/overview", true));

    expect(store.getSnapshot()).toEqual({
      status: "ready",
      persisted: false,
      recovered: false,
      state: record({ completed: { "just-enough-bash": ["learning/overview"] } }),
    });
    expect(entries.has(PROGRESS_STORAGE_KEY)).toBe(false);
  });

  it("keeps the new state in memory with persisted false when setItem throws", () => {
    const { control, storage } = fakeStorage();
    const store = createProgressStore(() => storage, null);
    store.getSnapshot();
    control.throwOn = "setItem";

    store.update((current) => setPageComplete(current, "just-enough-bash", "learning/overview", true));

    expect(store.getSnapshot()).toEqual({
      status: "ready",
      persisted: false,
      recovered: false,
      state: record({ completed: { "just-enough-bash": ["learning/overview"] } }),
    });
  });

  it("recovers from an invalid stored value and replaces it on the next write", () => {
    const { entries, storage } = fakeStorage({ [PROGRESS_STORAGE_KEY]: "not json" });
    const store = createProgressStore(() => storage, null);

    expect(store.getSnapshot()).toEqual({ status: "ready", persisted: true, recovered: true, state: EMPTY });
    expect(entries.get(PROGRESS_STORAGE_KEY)).toBe("not json");

    store.update((current) => setPageComplete(current, "just-enough-bash", "learning/overview", true));

    expect(JSON.parse(entries.get(PROGRESS_STORAGE_KEY) as string).completed).toEqual({
      "just-enough-bash": ["learning/overview"],
    });
  });

  it("applies an update to the latest stored state so another tab's change survives", () => {
    const { entries, storage } = fakeStorage({
      [PROGRESS_STORAGE_KEY]: serializeProgress(record({ completed: { "just-enough-bash": ["learning/overview"] } })),
    });
    const store = createProgressStore(() => storage, null);
    store.getSnapshot();

    entries.set(
      PROGRESS_STORAGE_KEY,
      serializeProgress(
        record({ completed: { "just-enough-bash": ["learning/overview"], "just-enough-lua": ["drill/one"] } }),
      ),
    );

    store.update((current) => setPageComplete(current, "extending-neovim", "learning/beginner", true));

    expect(Object.keys(JSON.parse(entries.get(PROGRESS_STORAGE_KEY) as string).completed).sort()).toEqual([
      "extending-neovim",
      "just-enough-bash",
      "just-enough-lua",
    ]);
  });

  it("re-reads and notifies when the progress key changes in another tab", () => {
    const target = new EventTarget();
    const { entries, storage } = fakeStorage();
    const store = createProgressStore(() => storage, target);
    const listener = vi.fn();
    store.subscribe(listener);
    const before = store.getSnapshot();

    entries.set(PROGRESS_STORAGE_KEY, serializeProgress(record({ completed: { "just-enough-lua": ["drill/one"] } })));
    target.dispatchEvent(new StorageEvent("storage", { key: PROGRESS_STORAGE_KEY }));

    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot()).not.toBe(before);
    expect(store.getSnapshot()).toEqual({
      status: "ready",
      persisted: true,
      recovered: false,
      state: record({ completed: { "just-enough-lua": ["drill/one"] } }),
    });
  });

  it("re-reads when a clear() arrives as a null key", () => {
    const target = new EventTarget();
    const { entries, storage } = fakeStorage({
      [PROGRESS_STORAGE_KEY]: serializeProgress(record({ completed: { "just-enough-bash": ["learning/overview"] } })),
    });
    const store = createProgressStore(() => storage, target);

    expect(ready(store.getSnapshot()).state).toEqual(
      record({ completed: { "just-enough-bash": ["learning/overview"] } }),
    );

    entries.delete(PROGRESS_STORAGE_KEY);
    target.dispatchEvent(new StorageEvent("storage", { key: null }));

    expect(ready(store.getSnapshot()).state).toEqual(EMPTY);
  });

  it("ignores a storage event for another key", () => {
    const target = new EventTarget();
    const { storage } = fakeStorage();
    const store = createProgressStore(() => storage, target);
    const listener = vi.fn();
    store.subscribe(listener);
    const before = store.getSnapshot();

    target.dispatchEvent(new StorageEvent("storage", { key: "some-other-key" }));

    expect(listener).not.toHaveBeenCalled();
    expect(store.getSnapshot()).toBe(before);
  });

  it("reset removes the key, empties the state, and notifies subscribers", () => {
    const { entries, storage } = fakeStorage({
      [PROGRESS_STORAGE_KEY]: serializeProgress(record({ completed: { "just-enough-bash": ["learning/overview"] } })),
    });
    const store = createProgressStore(() => storage, null);
    const listener = vi.fn();
    store.subscribe(listener);
    store.getSnapshot();

    store.reset();

    expect(entries.has(PROGRESS_STORAGE_KEY)).toBe(false);
    expect(store.getSnapshot()).toEqual({ status: "ready", persisted: true, recovered: false, state: EMPTY });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("reset empties the state but keeps the key when removeItem throws", () => {
    const { control, entries, storage } = fakeStorage({
      [PROGRESS_STORAGE_KEY]: serializeProgress(record({ completed: { "just-enough-bash": ["learning/overview"] } })),
    });
    const store = createProgressStore(() => storage, null);
    store.getSnapshot();
    control.throwOn = "removeItem";

    store.reset();

    expect(entries.has(PROGRESS_STORAGE_KEY)).toBe(true);
    expect(store.getSnapshot()).toEqual({ status: "ready", persisted: false, recovered: false, state: EMPTY });
  });

  it("reset falls back to memory mode when no storage exists", () => {
    const store = createProgressStore(() => null, null);

    store.reset();

    expect(store.getSnapshot()).toEqual({ status: "ready", persisted: false, recovered: false, state: EMPTY });
  });

  it("returns one frozen unknown server snapshot", () => {
    const store = createProgressStore(() => null, null);
    const snapshot = store.getServerSnapshot();

    expect(snapshot).toEqual({ status: "unknown" });
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(store.getServerSnapshot()).toBe(snapshot);
  });
});

describe("learningProgressStore", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("reads, writes, and resets the real localStorage under the one progress key", () => {
    window.localStorage.clear();

    expect(learningProgressStore.getSnapshot().status).toBe("ready");

    learningProgressStore.update((current) => setPageComplete(current, "just-enough-bash", "learning/overview", true));

    expect(JSON.parse(window.localStorage.getItem(PROGRESS_STORAGE_KEY) as string).completed).toEqual({
      "just-enough-bash": ["learning/overview"],
    });

    learningProgressStore.reset();

    expect(window.localStorage.getItem(PROGRESS_STORAGE_KEY)).toBeNull();
  });

  it("returns the frozen unknown server snapshot without touching storage", () => {
    expect(learningProgressStore.getServerSnapshot()).toEqual({ status: "unknown" });
  });
});
