// @vitest-environment jsdom
// => DOM pragma: event sequences dispatch into a document.

import { afterEach, expect, test } from "vitest";
// => Runner trio unchanged: the comparison is between two dispatchers.

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
// => fireEvent arrives beside the usual imports: same file, both tools.
// => Comparing in one file keeps the sequences literally side by side.

import React from "react";
// => JSX renders a bare button: listeners below record whatever arrives.

import userEvent from "@testing-library/user-event";
// => user-event simulates full interaction sequences, not single raw events.
// => Its sequence should be a superset of the fireEvent single dispatch.

afterEach(() => {
  cleanup();
  // => Isolation hook: recorded listener logs must not cross cases.
});

test("user-event dispatches the full sequence", async () => {
  // => The claim under test: full sequence, in browser order, all awaited.
  const user = userEvent.setup({ delay: null });
  // => setup() builds an isolated session: no state leaks between tests.
  // => delay null removes inter-keystroke pauses: fast and deterministic.
  const seen: string[] = [];
  // => Shared log: each listener pushes its event name in arrival order.
  render(<button type="button">Go</button>);
  // => Bare button: no handlers in markup, listeners attach below instead.
  const button = screen.getByRole("button", { name: "Go" });
  // => One button, found once: both dispatches below target this element.
  for (const kind of ["pointerdown", "mousedown", "focus", "click"] as const) {
    // => Four listeners cover the pointer-mouse-focus-click chain browsers run.
    button.addEventListener(kind, () => seen.push(kind));
    // => Each push records arrival: order in the array IS the sequence proof.
  }
  await user.click(button);
  // => Awaited full click: pointer, mouse, focus, then click, in order.
  // => user-event reproduces what Chromium dispatches for a real press.
  expect(seen).toEqual(["pointerdown", "mousedown", "focus", "click"]);
  // => Exact order asserted: any skip or reorder fails this comparison.
  // => Handlers on pointerdown or focus run in production: they run here too.
});

test("fireEvent dispatches only the named event", async () => {
  // => The contrast: one dispatch, nothing before or after it.
  const seen: string[] = [];
  // => Fresh log: this case must not inherit the previous case's events.
  render(<button type="button">Go</button>);
  // => Identical markup: the only variable between cases is the dispatcher.
  const button = screen.getByRole("button", { name: "Go" });
  // => Same query, same element: comparison stays apples to apples.
  for (const kind of ["pointerdown", "mousedown", "focus", "click"] as const) {
    // => Identical listener set: the log would catch any extra dispatch.
    button.addEventListener(kind, () => seen.push(kind));
  }
  fireEvent.click(button);
  // => fireEvent is synchronous: no await, one synthetic click, nothing else.
  // => Fast and precise for unit-style dispatch, blind to browser choreography.
  expect(seen).toEqual(["click"]);
  // => Only click arrived: focus handlers and pointer logic never ran here.
  // => A component wired to onFocus would pass this test and fail for users.
});
