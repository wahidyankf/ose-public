import { afterEach, expect, test, vi } from "vitest";
// => vi drives timers and records fetch attempts: time plus IO in one file.

// => Restore hook: interleaved async state must not escape the case.
afterEach(() => {
  vi.useRealTimers();
  // => Restore real timers: interleaved async state must not escape the case.
  // => Hook closes: real timers back before the next file runs.
});

// => Poll loop: try, wait, retry, up to N tries, then report success or not.
async function pollUntilOk(
  check: () => Promise<boolean>, // => Injected async check: the scripted answers below drive each attempt.
  intervalMs: number, // => Wait between attempts: advanced by the test, never wall-clocked.
  tries: number, // => Attempt cap: bounds the loop so tests stay finite by design.
): Promise<boolean> {
  // => Poll loop: try, wait, retry, up to N tries, then report success or not.
  // => Pure orchestration over an injected async check: the test scripts both.
  for (let attempt = 0; attempt < tries; attempt += 1) {
    // => Bounded loop: tries caps the waiting, tests stay finite by design.
    if (await check()) return true;
    // => Awaited check: success short-circuits before any waiting happens.
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    // => Timer wait between attempts: the fake clock below fast-forwards it.
  }
  return false;
  // => Exhausted tries report false: giving up is a designed outcome too.
}

test("third attempt succeeds after two waits", async () => {
  // => Script: false, false, true with 100ms waits: attempts and time pinned.
  vi.useFakeTimers();
  // => Fake clock before the loop starts: every wait is advance-driven.
  // => Scripted answers: false, false, then true — the loop's whole script.
  const check = vi
    .fn<() => Promise<boolean>>()
    .mockResolvedValueOnce(false)
    .mockResolvedValueOnce(false)
    .mockResolvedValue(true);
  // => Three scripted answers: two failures, then success on attempt three.
  // => Once-queue mirrors the loop iterations: readable and exact.
  // => Start the loop WITHOUT awaiting: the test drives time from outside.
  const pending = pollUntilOk(check, 100, 5);
  // => Start the loop WITHOUT awaiting: the test drives time from outside.
  // => Un-awaited promise plus external clock: the standard timer-test shape.
  // => Driver advances through both waits, flushing promises between them.
  const drive = (async (): Promise<boolean> => {
    // => Driver advances through both waits, flushing promises between them.
    await vi.advanceTimersByTimeAsync(100);
    // => First wait elapses AND microtasks flush: attempt two runs now.
    await vi.advanceTimersByTimeAsync(100);
    // => Second wait elapses: attempt three runs and returns true.
    return pending;
    // => Return the loop promise: resolved value asserted by the caller.
  })();
  // => Immediately invoked driver: time moves only when the test says so.
  const result = await drive;
  // => Await the driver: loop promise resolves inside, result flows out.
  expect(result).toBe(true);
  // => Success on attempt three: retry logic plus timing, both proved.
  expect(check).toHaveBeenCalledTimes(3);
  // => Three checks, two waits: the loop cadence matches the script exactly.
  // => Case closes: success on attempt three, cadence exactly as scripted.
});
