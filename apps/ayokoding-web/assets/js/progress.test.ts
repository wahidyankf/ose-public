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
  detectBlockedStorage,
  emptyRecord,
  formatProgressCount,
  isValidPageID,
  isValidRecord,
  loadRecord,
  markComplete,
  markIncomplete,
  clampSidebarWidth,
  nextTabIndex,
  nextTheme,
  parseSidebarWidth,
  parseTheme,
  refreshCourseDisplay,
  requestCarriesProgress,
  saveRecord,
  serializeRecord,
  subscribeCrossTab,
  tabLabels,
  togglePageCompletion,
  wireCompletionToggle,
  wireCopyControl,
  wireResetControl,
  wireSidebarResize,
  wireTabGroup,
  wireThemeToggle,
  type CompletionToggle,
  type CopyControl,
  type SidebarControl,
  type TabGroup,
  type ThemeControl,
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

describe("completion toggle wiring (P3 E1)", () => {
  const labels = { mark: "Mark as complete", unmark: "Mark as not complete" };

  function toggleHarness(initial: string[] = []) {
    const storage = memoryStorage(
      initial.length > 0
        ? {
            [PROGRESS_KEY]: JSON.stringify({
              version: 1,
              completed: initial,
              lastPath: "",
              lastCourse: "",
            }),
          }
        : {},
    );
    let pressed = false;
    let label = "";
    const handlers: Array<() => void> = [];
    const toggle: CompletionToggle = {
      pageID: "go-basics/hello-world",
      setPressed: (next, text) => {
        pressed = next;
        label = text;
      },
      onToggle: (handler) => {
        handlers.push(handler);
      },
    };
    const notices: string[] = [];
    const wired = wireCompletionToggle(
      toggle,
      { setText: (message) => notices.push(message) },
      { read: storage.read, write: storage.write, labels },
    );
    return {
      wired,
      storage,
      handlers,
      state: () => ({ pressed, label }),
      notices,
    };
  }

  it("toggles one page between complete and incomplete with announcements", () => {
    const { wired, storage, handlers, state, notices } = toggleHarness();
    expect(wired).toBe(true);
    expect(state()).toEqual({ pressed: false, label: "Mark as complete" });
    handlers[0]?.();
    expect(loadRecord(storage.read).completed).toEqual(["go-basics/hello-world"]);
    expect(state()).toEqual({ pressed: true, label: "Mark as not complete" });
    expect(notices).toEqual(["Mark as not complete"]);
    handlers[0]?.();
    expect(loadRecord(storage.read).completed).toEqual([]);
    expect(state()).toEqual({ pressed: false, label: "Mark as complete" });
  });

  it("syncs the initial pressed state from saved progress", () => {
    const { wired, state } = toggleHarness(["go-basics/hello-world"]);
    expect(wired).toBe(true);
    expect(state()).toEqual({ pressed: true, label: "Mark as not complete" });
  });

  it("reports a missing toggle without touching storage", () => {
    let called = false;
    expect(
      wireCompletionToggle(null, null, {
        read: () => {
          called = true;
          return null;
        },
        write: () => {
          called = true;
        },
        labels,
      }),
    ).toBe(false);
    expect(called).toBe(false);
  });

  it("toggles completion purely without storage", () => {
    const done = togglePageCompletion(emptyRecord(), "go-basics/hello-world");
    expect(done.completed).toBe(true);
    expect(done.record.completed).toEqual(["go-basics/hello-world"]);
    const undone = togglePageCompletion(done.record, "go-basics/hello-world");
    expect(undone.completed).toBe(false);
    expect(undone.record.completed).toEqual([]);
  });

  it("refreshes course markers and counts completed pages", () => {
    const seen = new Map<string, boolean>();
    const record = markComplete(emptyRecord(), "go-basics/hello-world");
    const done = refreshCourseDisplay(
      [
        { pageID: "go-basics/hello-world", setCompleted: (v) => void seen.set("go-basics/hello-world", v) },
        { pageID: "go-basics/setup", setCompleted: (v) => void seen.set("go-basics/setup", v) },
      ],
      record,
    );
    expect(done).toBe(1);
    expect(seen.get("go-basics/hello-world")).toBe(true);
    expect(seen.get("go-basics/setup")).toBe(false);
  });

  it("formats the course count from the page pattern", () => {
    expect(formatProgressCount(1, 2, "{done} of {total} pages done")).toBe("1 of 2 pages done");
    expect(formatProgressCount(1, 2, "{done} dari {total} halaman selesai")).toBe("1 dari 2 halaman selesai");
  });

  it("detects blocked storage from a throwing probe", () => {
    expect(detectBlockedStorage(() => {})).toBe(false);
    expect(
      detectBlockedStorage(() => {
        throw new Error("blocked");
      }),
    ).toBe(true);
  });
});

describe("copy control wiring (P3 E4)", () => {
  const labels = { copy: "Copy", copied: "Copied", failed: "Copy failed" };

  function copyHarness(source = "package main") {
    const handlers: Array<() => void> = [];
    const states: Array<string> = [];
    const shown: Array<string> = [];
    let copied = "";
    const control: CopyControl = {
      source,
      setState: (state, label) => {
        states.push(state);
        shown.push(label);
      },
      onActivate: (handler) => {
        handlers.push(handler);
      },
    };
    const wired = wireCopyControl(control, {
      copyText: (text) => {
        copied = text;
        return Promise.resolve();
      },
      labels,
    });
    return { wired, handlers, states, shown, copied: () => copied };
  }

  it("copies the code source and confirms with feedback", async () => {
    const { wired, handlers, states, shown, copied } = copyHarness("package main // source");
    expect(wired).toBe(true);
    handlers[0]?.();
    await Promise.resolve();
    expect(copied()).toBe("package main // source");
    expect(states).toEqual(["copied"]);
    expect(shown).toEqual(["Copied"]);
  });

  it("announces failures without copying", async () => {
    const states: Array<string> = [];
    const shown: Array<string> = [];
    const handlers: Array<() => void> = [];
    const wired = wireCopyControl(
      {
        source: "x",
        setState: (state, label) => {
          states.push(state);
          shown.push(label);
        },
        onActivate: (handler) => {
          handlers.push(handler);
        },
      },
      {
        copyText: () => Promise.reject(new Error("denied")),
        labels,
      },
    );
    expect(wired).toBe(true);
    handlers[0]?.();
    await Promise.resolve();
    await Promise.resolve();
    expect(states).toEqual(["failed"]);
    expect(shown).toEqual(["Copy failed"]);
  });

  it("reports a missing copy control without touching the clipboard", () => {
    let called = false;
    expect(
      wireCopyControl(null, {
        copyText: () => {
          called = true;
          return Promise.resolve();
        },
        labels,
      }),
    ).toBe(false);
    expect(called).toBe(false);
  });
});

describe("tab group wiring (P3 E5)", () => {
  function tabHarness(count = 2) {
    const selected: boolean[] = [];
    const activated: number[] = [];
    const selections: Array<(index: number) => void> = [];
    const group: TabGroup = {
      labels: tabLabels("first,second", count),
      panels: Array.from({ length: count }, () => ({
        setSelected: (selectedValue) => {
          selected.push(selectedValue);
        },
      })),
      setActive: (index) => {
        activated.push(index);
      },
      onSelect: (handler) => {
        selections.push(handler);
      },
    };
    return { group, selected, activated, selections };
  }

  it("shows exactly the selected panel and reports tab order", () => {
    expect(tabLabels("first,second", 2)).toEqual(["first", "second"]);
    expect(tabLabels("", 2)).toEqual(["Tab 1", "Tab 2"]);
    expect(nextTabIndex(1, 2, 1)).toBe(0);
    expect(nextTabIndex(0, 2, -1)).toBe(1);
    const { group, selected, activated, selections } = tabHarness(2);
    expect(wireTabGroup(group)).toBe(true);
    expect(selected).toEqual([true, false]);
    expect(activated).toEqual([0]);
    selections[0]?.(1);
    expect(selected.slice(2)).toEqual([false, true]);
    expect(activated).toEqual([0, 1]);
  });

  it("reports a missing or empty tab group without touching panels", () => {
    expect(wireTabGroup(null)).toBe(false);
    expect(wireTabGroup({ labels: [], panels: [], setActive: () => {}, onSelect: () => {} })).toBe(false);
  });
});

describe("theme toggle wiring (P3 E7)", () => {
  function themeHarness(saved: string | null) {
    const written = new Map<string, string>();
    if (saved !== null) written.set("theme", saved);
    let applied: string = "light";
    const toggles: Array<() => void> = [];
    const control: ThemeControl = {
      getTheme: () => (applied === "dark" ? "dark" : "light"),
      setTheme: (theme) => {
        applied = theme;
      },
      onToggle: (handler) => {
        toggles.push(handler);
      },
    };
    const wired = wireThemeToggle(control, {
      read: (key) => (written.has(key) ? (written.get(key) as string) : null),
      write: (key, value) => {
        written.set(key, value);
      },
    });
    return { wired, toggles, applied: () => applied, stored: () => written.get("theme") ?? null };
  }

  it("restores the saved theme and toggles with persistence", () => {
    const { wired, toggles, applied, stored } = themeHarness("dark");
    expect(wired).toBe(true);
    expect(applied()).toBe("dark");
    toggles[0]?.();
    expect(applied()).toBe("light");
    expect(stored()).toBe("light");
  });

  it("defaults to light and cycles back to dark", () => {
    expect(parseTheme(null)).toBe("light");
    expect(parseTheme("dark")).toBe("dark");
    expect(parseTheme("system")).toBe("light");
    expect(nextTheme("light")).toBe("dark");
    expect(nextTheme("dark")).toBe("light");
    const { applied } = themeHarness(null);
    expect(applied()).toBe("light");
  });

  it("survives blocked storage without throwing", () => {
    let applied: string = "light";
    const toggles: Array<() => void> = [];
    expect(
      wireThemeToggle(
        {
          getTheme: () => "light",
          setTheme: (theme) => {
            applied = theme;
          },
          onToggle: (handler) => {
            toggles.push(handler);
          },
        },
        {
          read: () => null,
          write: () => {
            throw new Error("blocked");
          },
        },
      ),
    ).toBe(true);
    toggles[0]?.();
    expect(applied).toBe("dark");
  });

  it("reports a missing toggle without touching storage", () => {
    let called = false;
    expect(
      wireThemeToggle(null, {
        read: () => {
          called = true;
          return null;
        },
        write: () => {
          called = true;
        },
      }),
    ).toBe(false);
    expect(called).toBe(false);
  });
});

describe("sidebar resize wiring (P3 E7)", () => {
  it("parses and clamps persisted widths within the 15%-35% band", () => {
    expect(parseSidebarWidth(null)).toBeNull();
    expect(parseSidebarWidth("240")).toBe(240);
    expect(parseSidebarWidth("-10")).toBeNull();
    expect(parseSidebarWidth("huge")).toBeNull();
    expect(clampSidebarWidth(240, 1280)).toBe(240);
    expect(clampSidebarWidth(50, 1280)).toBe(192);
    expect(clampSidebarWidth(900, 1280)).toBe(448);
    expect(clampSidebarWidth(240, 375)).toBe(131);
    expect(clampSidebarWidth(200, 768)).toBe(200);
  });

  it("restores the saved width and persists resizes", () => {
    const written = new Map<string, string>([["ayokoding-sidebar-width", "240"]]);
    let applied = 240;
    const resizes: Array<(next: number) => void> = [];
    const control: SidebarControl = {
      getWidth: () => applied,
      setWidth: (px) => {
        applied = px;
      },
      onResize: (handler) => {
        resizes.push(handler);
      },
    };
    expect(
      wireSidebarResize(control, () => 1280, {
        read: (key) => (written.has(key) ? (written.get(key) as string) : null),
        write: (key, value) => {
          written.set(key, value);
        },
      }),
    ).toBe(true);
    expect(applied).toBe(240);
    resizes[0]?.(260);
    expect(applied).toBe(260);
    expect(written.get("ayokoding-sidebar-width")).toBe("260");
    resizes[0]?.(900);
    expect(applied).toBe(448);
  });

  it("reports a missing handle without touching storage", () => {
    let called = false;
    expect(
      wireSidebarResize(null, () => 1280, {
        read: () => {
          called = true;
          return null;
        },
        write: () => {
          called = true;
        },
      }),
    ).toBe(false);
    expect(called).toBe(false);
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
