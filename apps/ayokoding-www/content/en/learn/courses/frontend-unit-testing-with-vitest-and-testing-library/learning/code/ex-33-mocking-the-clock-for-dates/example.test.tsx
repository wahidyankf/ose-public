// @vitest-environment jsdom
// => DOM pragma: the formatted date renders into a document paragraph.

import { afterEach, expect, test, vi } from "vitest";
// => vi controls the clock here: setSystemTime plus fake timers together.

import { cleanup, render, screen } from "@testing-library/react";
// => Single text query: the clock output is one rendered string.

import "@testing-library/jest-dom/vitest";
// => toHaveTextContent pins the frozen timestamp's rendered form.

import React from "react";
// => No state, no effects: the component reads the clock at render time.

afterEach(() => {
  cleanup();
  // => Unmount the clock: rendered timestamps must not leak across cases.
  vi.useRealTimers();
  // => Restore real timers: a frozen clock leaking forward freezes everything.
});

function InvoiceDate(): React.JSX.Element {
  // => Local subject: renders today's date in ISO form, nothing else.
  const today = new Date(Date.now()).toISOString().slice(0, 10);
  // => Date.now is the seam: setSystemTime below pins it to a fixed instant.
  // => Slice takes the date part: time-of-day never enters the assertion.
  return <p>Billed on {today}</p>;
  // => Rendered sentence: the full observable output of this component.
}

test("renders the frozen system date", async () => {
  // => Determinism claim: the same instant renders the same string, always.
  vi.useFakeTimers();
  // => Fake timers are required: setSystemTime only works on a fake clock.
  vi.setSystemTime(new Date("2026-03-15T10:00:00Z"));
  // => Frozen instant: March 15, a fixed point the assertion below expects.
  // => UTC instant: TZ=UTC in the harness keeps date math identical everywhere.
  render(<InvoiceDate />);
  // => Render reads the frozen clock: no race with the real wall time.
  expect(screen.getByText("Billed on 2026-03-15")).toBeInTheDocument();
  // => Exact rendered string: year, month, day all pinned by the frozen clock.
  // => Without the freeze this test passes only on March 15: a yearly flake.
});
