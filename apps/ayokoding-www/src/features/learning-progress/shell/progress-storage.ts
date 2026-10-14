import { PROGRESS_STORAGE_KEY, type ProgressState } from "@/features/learning-progress/core/progress-schema";
import { emptyProgress, parseProgress, serializeProgress } from "@/features/learning-progress/core/progress-state";

export type ProgressSnapshot =
  | { status: "unknown" }
  | { status: "ready"; persisted: boolean; recovered: boolean; state: ProgressState };

export interface ProgressStore {
  subscribe(onChange: () => void): () => void;
  getSnapshot(): ProgressSnapshot;
  getServerSnapshot(): ProgressSnapshot;
  update(change: (state: ProgressState) => ProgressState): void;
  reset(): void;
}

type StorageRead =
  | { persisted: true; storage: Storage; state: ProgressState; recovered: boolean }
  | { persisted: false; state: ProgressState; recovered: boolean };

const SERVER_SNAPSHOT: ProgressSnapshot = Object.freeze({ status: "unknown" });

/**
 * The guarded progress store (plan 04, tech-docs/002 Guarded Storage). Browsers can refuse or
 * break `localStorage`, so every call sits in `try/catch` and any failure drops the store into
 * memory mode for the life of the tab (`persisted: false`), which the UI reports. The first read
 * is lazy, the snapshot is immutable between changes, an unreadable record is replaced rather
 * than thrown away, and a `storage` event keeps other tabs in sync. No other key is touched.
 */
export function createProgressStore(getStorage: () => Storage | null, target: EventTarget | null): ProgressStore {
  const listeners = new Set<() => void>();
  let snapshot: ProgressSnapshot | null = null;
  let storageResolved = false;
  let storage: Storage | null = null;
  let memoryMode = false;

  function emit(): void {
    for (const listener of listeners) {
      listener();
    }
  }

  function setSnapshot(next: ProgressSnapshot): void {
    snapshot = next;
    emit();
  }

  function resolveStorage(): Storage | null {
    if (!storageResolved) {
      storageResolved = true;
      try {
        storage = getStorage();
      } catch {
        storage = null;
      }
    }
    return storage;
  }

  function currentState(): ProgressState {
    return snapshot !== null && snapshot.status === "ready" ? snapshot.state : emptyProgress();
  }

  function readFromStorage(): StorageRead {
    if (memoryMode) {
      return { persisted: false, state: currentState(), recovered: false };
    }

    const current = resolveStorage();
    if (current === null) {
      memoryMode = true;
      return { persisted: false, state: currentState(), recovered: false };
    }

    let raw: string | null;
    try {
      raw = current.getItem(PROGRESS_STORAGE_KEY);
    } catch {
      memoryMode = true;
      return { persisted: false, state: currentState(), recovered: false };
    }

    const { state, recovered } = parseProgress(raw);
    return { persisted: true, storage: current, state, recovered };
  }

  function getSnapshot(): ProgressSnapshot {
    if (snapshot === null) {
      const read = readFromStorage();
      snapshot = { status: "ready", persisted: read.persisted, recovered: read.recovered, state: read.state };
    }
    return snapshot;
  }

  function update(change: (state: ProgressState) => ProgressState): void {
    const read = readFromStorage();
    const state = change(read.state);
    let persisted = read.persisted;

    if (read.persisted) {
      try {
        read.storage.setItem(PROGRESS_STORAGE_KEY, serializeProgress(state));
      } catch {
        memoryMode = true;
        persisted = false;
      }
    }

    setSnapshot({ status: "ready", persisted, recovered: false, state });
  }

  function reset(): void {
    const current = resolveStorage();
    if (current === null) {
      memoryMode = true;
    } else {
      try {
        current.removeItem(PROGRESS_STORAGE_KEY);
      } catch {
        memoryMode = true;
      }
    }

    setSnapshot({ status: "ready", persisted: !memoryMode, recovered: false, state: emptyProgress() });
  }

  function handleStorageEvent(event: Event): void {
    const key = (event as StorageEvent).key;
    if (key !== PROGRESS_STORAGE_KEY && key !== null) {
      return;
    }

    const read = readFromStorage();
    setSnapshot({ status: "ready", persisted: read.persisted, recovered: read.recovered, state: read.state });
  }

  target?.addEventListener("storage", handleStorageEvent);

  return {
    subscribe(onChange: () => void): () => void {
      listeners.add(onChange);
      return () => {
        listeners.delete(onChange);
      };
    },
    getSnapshot,
    getServerSnapshot(): ProgressSnapshot {
      return SERVER_SNAPSHOT;
    },
    update,
    reset,
  };
}

let lazyStore: ProgressStore | null = null;

function getLearningProgressStore(): ProgressStore {
  lazyStore ??= createProgressStore(() => window.localStorage, typeof window === "undefined" ? null : window);
  return lazyStore;
}

/** The app-wide store, built on first use so nothing touches `window` during a server render. */
export const learningProgressStore: ProgressStore = {
  subscribe: (onChange) => getLearningProgressStore().subscribe(onChange),
  getSnapshot: () => getLearningProgressStore().getSnapshot(),
  getServerSnapshot: () => getLearningProgressStore().getServerSnapshot(),
  update: (change) => getLearningProgressStore().update(change),
  reset: () => getLearningProgressStore().reset(),
};
