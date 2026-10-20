import { expect, test, vi } from "vitest";
// => vi is the mocking namespace: fn, spyOn, and mock all live under it.
// => Mocking starts with a bare recorder: no implementation, total memory.

function checkout(total: number, notify: (message: string) => void): string {
  // => The notifier arrives as a parameter: the seam the mock will fill.
  // => Dependency-as-argument is the most testable wiring: no imports to stub.
  if (total <= 0) throw new Error("Total must be positive");
  // => Guard clause: the recorder below only sees calls past this line.
  notify(`Charged $${total}`);
  // => The side effect under test: one call, one formatted message.
  return "ok";
  // => Return value stays trivial: the interaction is the assertion target.
}

test("records the notification call exactly", async () => {
  // => Case name states the recording claim: one call, exact arguments.
  const notify = vi.fn();
  // => vi.fn() with no implementation: records calls, returns undefined.
  // => Bare recorders suit void collaborators: nothing to compute, only proof.
  const result = checkout(25, notify);
  // => Call the real unit with the recorder in the collaborator's seat.
  expect(result).toBe("ok");
  // => Return value asserted first: the unit still does its own job.
  expect(notify).toHaveBeenCalledTimes(1);
  // => Exactly once: retries and double-sends fail this line immediately.
  expect(notify).toHaveBeenCalledWith("Charged $25");
  // => Exact arguments: the message format is part of the contract.
  // => Template drift like 'Charged $ 25' fails here, not in production logs.
  expect(notify.mock.calls[0]?.[0]).toBe("Charged $25");
  // => Raw call log access: first call, first argument, same fact, no magic.
  // => Optional chaining satisfies strict null checks on the tuple access.
});
