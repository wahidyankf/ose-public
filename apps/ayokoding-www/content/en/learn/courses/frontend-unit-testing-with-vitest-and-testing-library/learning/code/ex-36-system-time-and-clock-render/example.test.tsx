// @vitest-environment jsdom
// => DOM pragma: each tick re-renders a paragraph in the document.

import { afterEach, expect, test, vi } from "vitest";
// => vi drives both the system clock and the interval timers here.

import { act, cleanup, render, screen } from "@testing-library/react";
// => act joins the imports: bare timer advances below need explicit flushing.
// => One text query per tick: the clock output is a single paragraph.

import "@testing-library/jest-dom/vitest";
// => toHaveTextContent pins the frozen timestamp after each advance.

import React, { useEffect, useState } from "react";
// => Effect owns the interval; state owns the displayed second.

afterEach(() => {
  cleanup();
  // => Unmount the clock: intervals die with the component, then restore.
  vi.useRealTimers();
  // => Real timers back: frozen intervals must never leak into other cases.
});

// => Subject: epoch seconds ticking once per fake second.
function Ticker(): React.JSX.Element {
  // => Local subject: shows epoch seconds, ticking once per fake second.
  const [now, setNow] = useState(() => Date.now());
  // => Lazy initializer reads the clock once: setSystemTime below pins it.
  useEffect(() => {
    // => Interval effect: the timer under test lives exactly here.
    const id = setInterval(() => setNow(Date.now()), 1000);
    // => One-second cadence: each advance below fires exactly one tick.
    return () => clearInterval(id);
    // => Cleanup clears the interval: unmount never leaves timers running.
  }, []);
  return <p>Epoch seconds: {Math.floor(now / 1000)}</p>;
  // => Seconds displayed: advancing 1000ms must increment this by exactly 1.
}

test("each advanced second ticks the display", async () => {
  // => Two ticks, two assertions: cadence proved, not just one lucky update.
  vi.useFakeTimers();
  // => Fake timers before render: the effect's interval must be fake too.
  vi.setSystemTime(new Date("2026-03-15T10:00:00Z"));
  // => Frozen start: epoch 1773568800, a fixed number the test expects.
  render(<Ticker />);
  // => Mount starts the interval AND reads the frozen clock for state.
  expect(screen.getByText("Epoch seconds: 1773568800")).toBeInTheDocument();
  // => Initial render pinned: 2026-03-15T10:00:00Z in epoch seconds.
  // => Advance inside act(): the tick must commit before the assertion reads.
  act(() => {
    // => One fake second elapses: interval fires, setNow runs, React flushes.
    vi.advanceTimersByTime(1000);
    // => Synchronous inside act: no microtask gap, no torn read possible.
  });
  // => Block closes: the epoch display now reads exactly one second later.
  // => Fake timers plus React state: act() keeps the commit synchronous here.
  expect(screen.getByText("Epoch seconds: 1773568801")).toBeInTheDocument();
  // => Plus exactly one: cadence proved, no skipped or doubled ticks.
  // => Case closes: two ticks proved, cadence exactly one per second.
});
