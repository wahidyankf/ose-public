import { afterEach, expect, test, vi } from "vitest";
// => vi owns the clock here: fake timers, advance, and restore.

// => Restore hook: a frozen clock must never escape into the next file.
afterEach(() => {
  vi.useRealTimers();
  // => Restore real timers after every case: a frozen clock must never leak.
  // => Leaked fakes make the next file's awaits hang until timeout.
  // => Hook closes: real timers back before the next case starts.
});

// => Delayed helper: resolves after ms, the minimal timer-plus-promise shape.
function delayedValue<T>(value: T, ms: number): Promise<T> {
  // => The unit: resolves after a delay, like a debounced save or a poll.
  // => Generic over the value: the timer logic is independent of the payload.
  return new Promise((resolve) => {
    // => Promise executor runs immediately: the timer starts on call.
    setTimeout(() => resolve(value), ms);
    // => The ONLY clock read: advancing fake time fires this callback.
  });
}

test("advancing time resolves the delayed promise", async () => {
  // => The determinism claim: time jumps on command, never on wall clocks.
  vi.useFakeTimers();
  // => Fake timers replace setTimeout before the unit under test runs.
  // => Every timer the unit creates is now driven by explicit advances.
  let settled: string | null = null;
  // => Outside variable observes resolution: the promise writes here on fire.
  const pending = delayedValue("ready", 50);
  // => Promise created but unfired: frozen time holds the callback back.
  const observed = pending.then((v) => {
    // => Attach the observer BEFORE advancing: callbacks must be registered.
    settled = v;
  });
  // => Observer attached: nothing has fired yet, clock still frozen.
  expect(settled).toBeNull();
  // => Still null: frozen time proves the callback waits for the advance.
  vi.advanceTimersByTime(49);
  // => One millisecond short: the boundary assertion below needs this step.
  expect(settled).toBeNull();
  // => Still pending at 49ms: off-by-one timer bugs fail exactly here.
  vi.advanceTimersByTime(1);
  // => The final millisecond: the timer fires synchronously on advance.
  await observed;
  // => Flush microtasks: the fired timer's continuation runs on this await.
  // => Timer callbacks run sync, promise continuations need one microtask tick.
  expect(settled).toBe("ready");
  // => Resolved value observed: time travel complete, zero waiting involved.
  await pending;
  // => Await the original: the runner sees a clean async test, failures propagate.
});
