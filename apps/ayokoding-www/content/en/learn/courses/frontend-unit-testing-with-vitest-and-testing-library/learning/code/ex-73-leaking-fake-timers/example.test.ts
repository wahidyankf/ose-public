import { afterEach, expect, test, vi } from "vitest";
// => vi owns the clock lifecycle here: fake inside, real outside, always.

// => Restore hook: a leaking fake must not freeze the next case.
afterEach(() => {
  vi.useRealTimers();
  // => THE line under test: without it, the second case below hangs or lies.
  // => Restore belongs in afterEach, not at case end: failures must not leak.
  // => Hook closes: real timers back before the restoration proof runs.
});

// => Same helper shape as Example 35: timer plus promise, minimal and clear.
function delayedValue<T>(value: T, ms: number): Promise<T> {
  // => Same helper shape as Example 35: timer plus promise, minimal and clear.
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), ms);
  });
}

// => Fake-clock case: advances its own frozen clock, resolves, restores via the hook.
test("first case advances its own frozen clock", async () => {
  // => Fake-clock case: advances time, resolves, restores via the hook.
  vi.useFakeTimers();
  // => Freeze before creating the timer: the helper's setTimeout must be fake.
  const pending = delayedValue("fast", 1000);
  // => Second-long delay, resolved in zero wall time by the advance below.
  vi.advanceTimersByTime(1000);
  // => Full advance: callback fires synchronously, promise resolves after.
  return expect(pending).resolves.toBe("fast");
  // => Returned promise: the runner awaits it, failures blamed correctly.
});

// => Restoration proof: this case runs on the real clock, provably.
test("second case runs on real timers again", async () => {
  // => Restoration proof: setTimeout here must be the REAL one, provably.
  // => Direct clock inspection: fake would report true, restored reports false.
  expect(vi.isFakeTimers()).toBe(false);
  // => Direct clock inspection: fake would report true, restored reports false.
  // => Without the hook this fails: the freeze leaks and poisons this case.
  const pending = delayedValue("real", 10);
  // => Ten real milliseconds: fast enough to await honestly, no fakes needed.
  return expect(pending).resolves.toBe("real");
  // => Resolves on the wall clock: the suite's time flows normally again.
});
