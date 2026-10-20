// @vitest-environment jsdom
// => DOM pragma: the status text renders each polled value into a paragraph.

import { afterEach, expect, test, vi } from "vitest";
// => vi stubs fetch AND drives the interval: the two doubles cooperate here.

import { act, cleanup, render, screen } from "@testing-library/react";
// => act joins the imports: async advances below flush timers, promises, renders.
// => Single text query: status paragraph carries the latest polled value.

import "@testing-library/jest-dom/vitest";
// => toHaveTextContent asserts each poll result as the clock advances.

import React, { useEffect, useState } from "react";
// => Effect owns fetch-plus-interval; state owns the displayed status.

// => Isolation hook: fake clock, fetch stub, and mounts all reset here.
afterEach(() => {
  cleanup();
  // => Unmount clears the interval: polling must stop with the component.
  vi.useRealTimers();
  // => Restore timers: the five-second cadence stays inside this case.
  vi.unstubAllGlobals();
  // => Restore fetch: the stub below answers only for this polling test.
  // => Hook closes: interval, stub, and timers die with the case.
});

// => Hook: fetches now, then polls every five seconds, returns latest status.
function useStatus(): string {
  // => Local hook: fetches now, then polls every 5000ms, returns latest status.
  // => Unknown start: the test asserts this before any fetch lands.
  const [status, setStatus] = useState("unknown");
  // => Unknown start: the test asserts this before any fetch lands.
  // => Effect owns fetch-plus-interval: the polling lifecycle in one place.
  useEffect(() => {
    // => Alive flag: late responses after unmount must not set state.
    let alive = true;
    // => Alive flag: late responses after unmount must not set state.
    // => Loader: fetches once per call, guarded by the alive flag.
    const load = (): void => {
      void fetch("/api/status")
        .then((r) => r.json())
        .then((data) => {
          if (alive) setStatus((data as { status: string }).status);
        });
    };
    // => Immediate first load: mount fetches without waiting for a tick.
    load();
    // => Immediate first load: mount fetches without waiting for a tick.
    // => Five-second cadence: each advance below fires exactly one poll.
    const id = setInterval(load, 5000);
    // => Five-second cadence: each advance below fires exactly one poll.
    return () => {
      alive = false;
      // => Interval cleared: polling stops with the component, no ghost fetches.
      clearInterval(id);
    };
    // => Once per mount: interval installed on mount, cleared on unmount.
  }, []);
  // => Hook returns the latest polled value: the view reads this.
  return status;
}

// => Thin view over the hook: renders whatever the latest poll returned.
function StatusBadge(): React.JSX.Element {
  // => Thin view over the hook: renders whatever the latest poll returned.
  // => Hook call in the view: state flows from polling into markup.
  const status = useStatus();
  // => Status paragraph: the observable endpoint of every poll.
  return <p>Status: {status}</p>;
}

// => Cadence claim: one call on mount, then exactly one per tick.
test("mount fetches once, each tick fetches again", async () => {
  // => Cadence claim: 1 call on mount, then exactly 1 per advanced 5 seconds.
  // => Fake clock before render: the interval must be advance-driven.
  vi.useFakeTimers();
  // => Fake clock before render: the interval must be advance-driven.
  // => Stub the transport before mounting: polls resolve in microseconds.
  vi.stubGlobal(
    "fetch", // => Global name replaced: every poll in this file sees the stub.
    vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ status: "ok" }), {
          headers: { "Content-Type": "application/json" },
        }),
      ),
    ),
  );
  // => Fresh Response per call: bodies read once, so the stub rebuilds each time.
  // => Immediate stubbed answers: polls resolve in microseconds of fake time.
  // => Mount triggers the immediate load: first fetch fires synchronously.
  render(<StatusBadge />);
  // => Mount triggers the immediate load: first fetch fires synchronously.
  // => One call with zero ticks: the immediate load, proved separately.
  expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
  // => One call with zero ticks: the immediate load, proved separately.
  // => Async act advances clock, promises, and renders together: nothing tears.
  await act(async () => {
    // => First interval fires: second fetch dispatched, first response applied.
    await vi.advanceTimersByTimeAsync(5000);
    // => Async advance flushes timer callbacks AND the fetch continuations.
  });
  // => Block closes: both the call count and the rendered text are settled.
  // => First interval settled in one flush: still stubbed instant, now committed.
  // => Two calls after one tick: cadence is exactly one poll per interval.
  expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);
  // => Two calls after one tick: cadence is exactly one poll per interval.
  // => Two more intervals: total four calls, no more, no fewer.
  // => Second async act block: two more intervals, same full flush.
  await act(async () => {
    // => Two intervals elapse: polls three and four dispatch and resolve.
    await vi.advanceTimersByTimeAsync(10000);
    // => Ten fake seconds: every promise and every render committed inside.
  });
  // => Block closes: four calls dispatched, latest status rendered, all settled.
  // => Two more intervals: total four calls, no more, no fewer.
  expect(vi.mocked(fetch)).toHaveBeenCalledTimes(4);
  // => Linear cadence proved: mount plus one call per five fake seconds.
  // => Latest poll rendered: fetch, state, and display proved end to end.
  expect(screen.getByText("Status: ok")).toBeInTheDocument();
  // => Latest poll rendered: fetch, state, and display proved end to end.
  // => Case closes: mount plus three ticks, linear cadence proved.
});
