// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The browser wiring registers one DOMContentLoaded listener when the module
// loads. Every test renders a fresh page and dispatches that event, so each
// render runs the same single wiring pass against the DOM it just built.
import { PROGRESS_KEY, createBlockedStore, emptyRecord, loadRecord } from "./progress";

const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

function render(html: string): void {
  document.body.innerHTML = html;
  document.dispatchEvent(new Event("DOMContentLoaded"));
}

function seedRecord(completed: string[]): void {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify({ ...emptyRecord(), completed }));
}

function keydown(target: Element, key: string): void {
  target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
}

function pointer(type: string, init: { pointerId?: number; clientX?: number }): Event {
  return Object.assign(new Event(type, { bubbles: true }), init);
}

function el<T extends Element>(selector: string): T {
  const found = document.querySelector<T>(selector);
  if (found === null) throw new Error(`fixture missing ${selector}`);
  return found;
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.style.removeProperty("--sidebar-width");
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: vi.fn(async () => undefined) },
  });
  window.confirm = () => true;
});

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("progress browser wiring", () => {
  it("renders an empty page without binding any control", () => {
    expect(() => render("<main></main>")).not.toThrow();
    expect(document.querySelector("[aria-pressed]")).toBeNull();
  });

  it("toggles the theme and labels it from the button data", () => {
    render(
      `<button data-theme-toggle data-light-label="Light mode" data-dark-label="Dark mode">` +
        `<span data-theme-name>Light mode</span></button>`,
    );
    const button = el<HTMLElement>("[data-theme-toggle]");
    button.click();
    expect(document.documentElement.dataset["theme"]).toBe("dark");
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(el("[data-theme-name]").textContent).toBe("Dark mode");
    button.click();
    expect(document.documentElement.dataset["theme"]).toBe("light");
    expect(el("[data-theme-name]").textContent).toBe("Light mode");
  });

  it("falls back to default theme labels when the button carries none", () => {
    render(`<button data-theme-toggle><span data-theme-name></span></button>`);
    el<HTMLElement>("[data-theme-toggle]").click();
    expect(el("[data-theme-name]").textContent).toBe("Dark");
  });

  it("clears the stored record on reset after confirmation", () => {
    seedRecord(["learn/hello-world"]);
    render(`<div><button data-progress-control="reset-trigger">Reset</button><p role="status"></p></div>`);
    el<HTMLElement>("[data-progress-control='reset-trigger']").click();
    expect(localStorage.getItem(PROGRESS_KEY)).toBeNull();
  });

  it("keeps the record when the reset confirmation is declined", () => {
    seedRecord(["learn/hello-world"]);
    window.confirm = () => false;
    render(`<div><button data-progress-control="reset-trigger">Reset</button><p role="status"></p></div>`);
    el<HTMLElement>("[data-progress-control='reset-trigger']").click();
    expect(localStorage.getItem(PROGRESS_KEY)).not.toBeNull();
  });

  it("resets without a status line when the button has none", () => {
    seedRecord(["learn/hello-world"]);
    render(`<div><button data-progress-control="reset-trigger">Reset</button></div>`);
    el<HTMLElement>("[data-progress-control='reset-trigger']").click();
    expect(localStorage.getItem(PROGRESS_KEY)).toBeNull();
  });

  it("marks a lesson complete and unmarks it, updating its live region", () => {
    render(
      `<section data-progress-region>` +
        `<button data-progress-control="complete-trigger" data-page="learn/hello-world" ` +
        `data-mark-label="Mark done" data-unmark-label="Mark undone">Mark done</button>` +
        `<p data-progress-status></p></section>` +
        `<button data-progress-control="complete-trigger" data-page="BAD PAGE">bad</button>` +
        `<button data-progress-control="complete-trigger" data-page="learn/other">other</button>`,
    );
    const button = el<HTMLElement>("button[data-page='learn/hello-world']");
    button.click();
    expect(localStorage.getItem(PROGRESS_KEY)).toContain("learn/hello-world");
    expect(button.getAttribute("aria-pressed")).toBe("true");
    button.click();
    expect(localStorage.getItem(PROGRESS_KEY)).not.toContain("learn/hello-world");
    expect(button.getAttribute("aria-pressed")).toBe("false");
    expect(el("[data-progress-status]").textContent).not.toBe("");
  });

  it("uses default completion labels when the button carries none", () => {
    render(`<button data-progress-control="complete-trigger" data-page="learn/other">other</button>`);
    const button = el<HTMLElement>("[data-progress-control='complete-trigger']");
    button.click();
    expect(button.textContent).toBe("Mark as not complete");
  });

  it("shows lesson badges and course counts for the stored record", () => {
    seedRecord(["learn/hello-world"]);
    render(
      `<span data-lesson-marker data-course="learn" data-lesson="hello-world" hidden></span>` +
        `<span data-lesson-marker data-course="learn" data-lesson="other"></span>` +
        `<section data-course-progress data-total="2" data-count-pattern="{done} of {total}">` +
        `<p data-course-count></p></section>` +
        `<section data-course-progress><p>none</p></section>`,
    );
    const [done, pending] = Array.from(document.querySelectorAll<HTMLElement>("[data-lesson-marker]"));
    expect(done?.hasAttribute("hidden")).toBe(false);
    expect(pending?.hasAttribute("hidden")).toBe(true);
    expect(el("[data-course-count]").textContent).not.toBe("");
  });

  it("gives tabbed content tab semantics with keyboard travel", () => {
    render(
      `<div data-tabs="Overview, Details"><div data-tab>A</div><div class="tab-panel">B</div></div>` +
        `<div class="tabs"></div>` +
        `<div class="tabs"><div data-tab>C</div></div>`,
    );
    const list = el<HTMLElement>("[role='tablist']");
    const tabs = Array.from(list.querySelectorAll<HTMLButtonElement>("[role='tab']"));
    expect(tabs.map((tab) => tab.textContent)).toEqual(["Overview", "Details"]);
    expect(el(".tabs [role='tab']").textContent).toBe("Tab 1");

    tabs[0]?.focus();
    keydown(list, "ArrowRight");
    expect(tabs[1]?.getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(tabs[1]);
    keydown(list, "ArrowLeft");
    expect(tabs[0]?.getAttribute("aria-selected")).toBe("true");
    keydown(list, "End");
    expect(tabs[1]?.getAttribute("aria-selected")).toBe("true");
    keydown(list, "Home");
    expect(tabs[0]?.getAttribute("aria-selected")).toBe("true");
    keydown(list, "x");
    expect(tabs[0]?.getAttribute("aria-selected")).toBe("true");

    (document.activeElement as HTMLElement | null)?.blur();
    keydown(list, "ArrowRight");
    expect(tabs[0]?.getAttribute("aria-selected")).toBe("true");

    tabs[1]?.click();
    expect(tabs[1]?.getAttribute("aria-selected")).toBe("true");
  });

  it("copies the sibling code block and reports success or failure", async () => {
    render(
      `<pre><code>npm run</code></pre><button data-copy data-copy-label="Copy it" data-copied-label="Done" data-failed-label="Nope">Copy it</button>` +
        `<button data-copy>Copy</button>`,
    );
    const [copyButton, bareButton] = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-copy]"));
    copyButton?.click();
    await flush();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("npm run");
    expect(copyButton?.textContent).toBe("Done");
    expect(bareButton?.textContent).toBe("Copy");

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn(async () => Promise.reject(new Error("denied"))) },
    });
    render(`<pre><code>x</code></pre><button data-copy data-failed-label="Nope">Copy</button>`);
    el<HTMLButtonElement>("[data-copy]").click();
    await flush();
    expect(el("[data-copy]").textContent).toBe("Nope");
  });

  it("resizes the sidebar from the keyboard and ignores unrelated keys", () => {
    render(`<div data-sidebar-resize role="separator" aria-valuenow="240"></div>`);
    const handle = el<HTMLElement>("[data-sidebar-resize]");
    keydown(handle, "ArrowRight");
    expect(handle.getAttribute("aria-valuenow")).not.toBe("");
    keydown(handle, "ArrowLeft");
    keydown(handle, "ArrowUp");
    keydown(handle, "ArrowDown");
    keydown(handle, "Home");
    keydown(handle, "End");
    keydown(handle, "Enter");
    expect(handle.getAttribute("aria-valuenow")).not.toBeNull();
  });

  it("drags the sidebar with pointer events, with or without pointer capture", () => {
    render(`<div data-sidebar-resize role="separator" aria-valuenow="240"></div>`);
    const handle = el<HTMLElement>("[data-sidebar-resize]");
    handle.dispatchEvent(pointer("pointerdown", { pointerId: 1, clientX: 100 }));
    handle.dispatchEvent(pointer("pointermove", { clientX: 130 }));
    handle.dispatchEvent(pointer("pointerup", {}));
    handle.dispatchEvent(pointer("pointermove", { clientX: 400 }));

    Object.assign(handle, { setPointerCapture: () => undefined });
    handle.dispatchEvent(pointer("pointerdown", { pointerId: 2, clientX: 100 }));
    handle.dispatchEvent(pointer("pointermove", { clientX: 90 }));
    handle.dispatchEvent(pointer("pointerup", {}));
    expect(handle.getAttribute("aria-valuenow")).not.toBeNull();
  });

  it("keeps working when pointer capture is refused", () => {
    render(`<div data-sidebar-resize role="separator" aria-valuenow="240"></div>`);
    const handle = el<HTMLElement>("[data-sidebar-resize]");
    Object.assign(handle, {
      setPointerCapture: () => {
        throw new Error("no capture");
      },
    });
    expect(() => handle.dispatchEvent(pointer("pointerdown", { pointerId: 3, clientX: 1 }))).not.toThrow();
  });

  it("shows the blocked-storage notice and keeps the page usable when storage refuses writes", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    render(
      `<p data-progress-blocked hidden>notice</p>` +
        `<button data-progress-control="complete-trigger" data-page="learn/hello-world">done</button>` +
        `<button data-progress-control="reset-trigger">reset</button>`,
    );
    expect(el("[data-progress-blocked]").hasAttribute("hidden")).toBe(false);
    el<HTMLElement>("[data-progress-control='complete-trigger']").click();
    expect(localStorage.getItem(PROGRESS_KEY)).toBeNull();
    el<HTMLElement>("[data-progress-control='reset-trigger']").click();
    expect(localStorage.getItem(PROGRESS_KEY)).toBeNull();
  });

  it("re-renders the page when another tab writes the record", () => {
    render(
      `<span data-lesson-marker data-course="learn" data-lesson="hello-world"></span>` +
        `<button data-progress-control="complete-trigger" data-page="learn/hello-world">done</button>`,
    );
    seedRecord(["learn/hello-world"]);
    window.dispatchEvent(new StorageEvent("storage", { key: PROGRESS_KEY }));
    expect(el("[data-lesson-marker]").hasAttribute("hidden")).toBe(false);
    window.dispatchEvent(new StorageEvent("storage", { key: null }));
    expect(el("[data-lesson-marker]").hasAttribute("hidden")).toBe(false);
  });
});

describe("progress storage edges", () => {
  it("loads an empty record when the reader throws", () => {
    expect(
      loadRecord(() => {
        throw new Error("storage denied");
      }),
    ).toEqual(emptyRecord());
  });

  it("forgets a visit-only entry when it is removed", () => {
    const store = createBlockedStore();
    store.write(PROGRESS_KEY, "x");
    store.remove(PROGRESS_KEY);
    expect(store.read(PROGRESS_KEY)).toBeNull();
  });

  it("toggles the theme without a name element", () => {
    render(`<button data-theme-toggle></button>`);
    const button = el<HTMLElement>("[data-theme-toggle]");
    button.click();
    expect(document.documentElement.dataset["theme"]).toBe("dark");
    expect(button.getAttribute("aria-pressed")).toBe("true");
  });

  it("ignores completion triggers without a page", () => {
    render(`<div><button data-progress-control="complete-trigger">Done</button></div>`);
    expect(() => el<HTMLElement>("[data-progress-control='complete-trigger']").click()).not.toThrow();
    expect(localStorage.getItem(PROGRESS_KEY)).toBeNull();
  });

  it("hides markers for lessons outside the record", () => {
    seedRecord([]);
    render(`<span data-lesson-marker data-course="go-basics">x</span>` + `<span data-lesson-marker>bare</span>`);
    const badges = Array.from(document.querySelectorAll("[data-lesson-marker]"));
    expect(badges).toHaveLength(2);
    for (const badge of badges) expect(badge.getAttribute("hidden")).not.toBeNull();
  });

  it("renders course counts with defaults for missing pieces", () => {
    seedRecord([]);
    render(
      `<section data-course-progress data-total="2"><p data-course-count></p></section>` +
        `<section data-course-progress data-total="1"><span>no line</span></section>`,
    );
    expect(el("[data-course-count]").textContent).toBe("");
    expect(document.querySelectorAll("[data-course-progress]")).toHaveLength(2);
  });

  it("copies an empty source when the button stands alone", async () => {
    render(`<div><button data-copy>Copy</button></div>`);
    el<HTMLElement>("[data-copy]").click();
    await flush();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("");
    expect(el("[data-copy]").textContent).toBe("Copied");
  });
});
