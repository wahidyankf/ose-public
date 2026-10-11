import { afterEach, describe, expect, it, vi } from "vitest";
// plan ayokoding-learn-revamp-01 §4.3 (Phase 5 RED): the module under test does not exist yet —
// this import failing to resolve is the expected RED face ("module not found"). The GREEN step
// creates `src/features/course-paths/shell/active-course-scroll.ts` with exactly these exports.
import {
  centeredScrollTop,
  findScrollContainer,
  scrollActiveCourseIntoView,
} from "../../../../../src/features/course-paths/shell/active-course-scroll";

/**
 * Unit tests for the active-course auto-scroll helper (plan ayokoding-learn-revamp-01 §4.3,
 * Decision D5): the rail scrolls its own `overflow-y: auto` container so the current course's
 * row is centred — never the page (`window.scrollTo` is never touched, so `prefers-reduced-motion`
 * is moot: there is no smooth-scroll motion to respect).
 *
 * jsdom has no layout engine, so scroll geometry is pinned explicitly: `scrollHeight` and
 * `clientHeight` via `Object.defineProperty`, `getBoundingClientRect` via spies.
 */

function makeEl(): HTMLDivElement {
  return document.createElement("div");
}

/** jsdom reports 0 for both metrics on every element; pin them to a scrollable geometry. */
function defineScrollGeometry(el: HTMLElement, scrollHeight: number, clientHeight: number): void {
  Object.defineProperty(el, "scrollHeight", { configurable: true, value: scrollHeight });
  Object.defineProperty(el, "clientHeight", { configurable: true, value: clientHeight });
}

function makeRect(top: number, height: number): DOMRect {
  return {
    top,
    height,
    bottom: top + height,
    left: 0,
    x: 0,
    y: top,
    width: 0,
    right: 0,
    toJSON: () => ({}),
  } as unknown as DOMRect;
}

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe("centeredScrollTop", () => {
  it("centres a middle row inside the container's visible box", () => {
    // Container occupies y=100..500 in the viewport; the row's viewport top is 900.
    // raw = containerScrollTop + (rowTop - containerTop) - (clientHeight - rowHeight) / 2
    //     = 0 + 800 - 178 = 622. After scrolling 622px the row's centre (900 - 622 + 22 = 300)
    // matches the container's visible centre (100 + 400 / 2 = 300).
    expect(
      centeredScrollTop({
        containerTop: 100,
        containerScrollTop: 0,
        containerClientHeight: 400,
        containerScrollHeight: 1200,
        rowTop: 900,
        rowHeight: 44,
      }),
    ).toBe(622);
  });

  it("rounds the raw offset to the nearest integer", () => {
    // (400 - 43) / 2 = 178.5 → raw 621.5 rounds to 622.
    expect(
      centeredScrollTop({
        containerTop: 100,
        containerScrollTop: 0,
        containerClientHeight: 400,
        containerScrollHeight: 1200,
        rowTop: 900,
        rowHeight: 43,
      }),
    ).toBe(622);
  });

  it("clamps to 0 when the row sits above the container's visible box", () => {
    // raw = 300 + (-500) - 178 = -378 → clamp to 0.
    expect(
      centeredScrollTop({
        containerTop: 0,
        containerScrollTop: 300,
        containerClientHeight: 400,
        containerScrollHeight: 2000,
        rowTop: -500,
        rowHeight: 44,
      }),
    ).toBe(0);
  });

  it("clamps to scrollHeight - clientHeight when the row sits past the last scrollable position", () => {
    // raw = 0 + 1500 - 178 = 1322, but the container can only scroll to 1200 - 400 = 800.
    expect(
      centeredScrollTop({
        containerTop: 0,
        containerScrollTop: 0,
        containerClientHeight: 400,
        containerScrollHeight: 1200,
        rowTop: 1500,
        rowHeight: 44,
      }),
    ).toBe(800);
  });
});

describe("findScrollContainer", () => {
  it("returns the nearest ancestor with inline overflow-y auto that actually overflows", () => {
    const outer = makeEl();
    const inner = makeEl();
    const child = makeEl();
    outer.append(inner);
    inner.append(child);
    document.body.append(outer);

    defineScrollGeometry(outer, 900, 300);
    outer.style.overflowY = "auto";
    defineScrollGeometry(inner, 500, 200);
    inner.style.overflowY = "auto";

    // Both ancestors qualify; the NEAREST one wins (the rail's own scroller, not a page-level one).
    expect(findScrollContainer(child)).toBe(inner);
  });

  it("skips non-scrollable ancestors whose content does not overflow", () => {
    const outer = makeEl();
    const middle = makeEl();
    const child = makeEl();
    outer.append(middle);
    middle.append(child);
    document.body.append(outer);

    defineScrollGeometry(outer, 900, 300);
    outer.style.overflowY = "auto";
    // overflow-y: auto, but scrollHeight === clientHeight → nothing to scroll → skipped.
    defineScrollGeometry(middle, 200, 200);
    middle.style.overflowY = "auto";

    expect(findScrollContainer(child)).toBe(outer);
  });

  it("accepts overflow-y: scroll as well as auto (tech-docs §4.3)", () => {
    const outer = makeEl();
    const child = makeEl();
    outer.append(child);
    document.body.append(outer);

    defineScrollGeometry(outer, 900, 300);
    outer.style.overflowY = "scroll";

    expect(findScrollContainer(child)).toBe(outer);
  });

  it("does not consider the element itself — only its ancestors", () => {
    const child = makeEl();
    document.body.append(child);
    defineScrollGeometry(child, 500, 200);
    child.style.overflowY = "auto";

    expect(findScrollContainer(child)).toBeNull();
  });

  it("returns null when the walk reaches document.body, even if body itself is scrollable", () => {
    const child = makeEl();
    document.body.append(child);
    // The page itself must never be selected as the scroll container.
    defineScrollGeometry(document.body, 900, 300);
    document.body.style.overflowY = "auto";

    expect(findScrollContainer(child)).toBeNull();
  });
});

describe("scrollActiveCourseIntoView", () => {
  it("does nothing when the row has no scroll container", () => {
    const row = makeEl();
    document.body.append(row);

    expect(() => scrollActiveCourseIntoView(row)).not.toThrow();
    expect(document.body.scrollTop).toBe(0);
  });

  it("does not move the container when the row is already fully visible", () => {
    const container = makeEl();
    const row = makeEl();
    container.append(row);
    document.body.append(container);
    defineScrollGeometry(container, 1200, 400);
    container.style.overflowY = "auto";
    container.scrollTop = 123;
    vi.spyOn(container, "getBoundingClientRect").mockReturnValue(makeRect(0, 400));
    vi.spyOn(row, "getBoundingClientRect").mockReturnValue(makeRect(10, 40)); // 10 + 40 <= 400

    scrollActiveCourseIntoView(row);

    expect(container.scrollTop).toBe(123);
  });

  it("sets container.scrollTop so a hidden row is centred", () => {
    const container = makeEl();
    const row = makeEl();
    container.append(row);
    document.body.append(container);
    defineScrollGeometry(container, 1200, 400);
    container.style.overflowY = "auto";
    vi.spyOn(container, "getBoundingClientRect").mockReturnValue(makeRect(0, 400));
    vi.spyOn(row, "getBoundingClientRect").mockReturnValue(makeRect(900, 44)); // below the box
    // raw = 0 + 900 - (400 - 44) / 2 = 722, within [0, 1200 - 400].

    scrollActiveCourseIntoView(row);

    expect(container.scrollTop).toBe(722);
  });

  it("never scrolls the page itself", () => {
    const container = makeEl();
    const row = makeEl();
    container.append(row);
    document.body.append(container);
    defineScrollGeometry(container, 1200, 400);
    container.style.overflowY = "auto";
    vi.spyOn(container, "getBoundingClientRect").mockReturnValue(makeRect(0, 400));
    vi.spyOn(row, "getBoundingClientRect").mockReturnValue(makeRect(900, 44));
    const scrollToSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => {});

    scrollActiveCourseIntoView(row);

    expect(scrollToSpy).not.toHaveBeenCalled();
    expect(window.scrollY).toBe(0);
  });
});
