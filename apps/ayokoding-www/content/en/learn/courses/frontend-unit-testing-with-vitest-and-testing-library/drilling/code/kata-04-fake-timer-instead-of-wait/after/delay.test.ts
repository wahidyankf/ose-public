// @vitest-environment jsdom
// => Pragma shared: katas keep the course shape even for pure logic.

import { afterEach, expect, test, vi } from "vitest";
// => Fake-clock surface: install before, restore after, every case.

import { delayedEcho } from "./delay";
// => Subject: the same setTimeout promise, now clock-driven.

afterEach(() => {
  vi.useRealTimers();
  // => Restore: the fake clock stays inside this kata's cases.
});

test("after: fake clock settles the timer in zero wall time", async () => {
  // => Target: green in milliseconds, deterministic on any machine.
  vi.useFakeTimers();
  // => Frozen clock: setTimeout schedules but never fires on its own.
  const pending = delayedEcho("ready", 300);
  // => Start the timer: pending until the suite advances the clock.
  const assertion = expect(pending).resolves.toBe("ready");
  // => Attach first: the assertion observes the settlement below.
  await vi.advanceTimersByTimeAsync(300);
  // => Advance past the delay: the timer fires, the promise settles.
  await assertion;
  // => Flush the observation: the recorded value matches.
});
