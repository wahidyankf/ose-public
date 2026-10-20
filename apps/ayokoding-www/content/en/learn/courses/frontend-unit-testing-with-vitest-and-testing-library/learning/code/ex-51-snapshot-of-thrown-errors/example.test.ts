import { expect, test } from "vitest";
// => Runner imports only: thrown errors snapshot without DOM or timers.

// => Named error: the snapshot freezes its message, not its stack.
class CheckoutError extends Error {
  // => Named error: the snapshot below freezes its message, not its stack.
  // => Stacks carry file paths: snapshots capture message only, stable always.
  constructor(total: number) {
    // => Offending total in: diagnostic message out, same as Example 5.
    super(`Cannot check out an empty cart (total: ${total})`);
    // => Message embeds the value: support reads it without rerunning.
    this.name = "CheckoutError";
  }
}

// => Guard-then-act: zero or negative totals throw before any side effect.
function checkout(total: number): string {
  // => Guard-then-act: zero or negative totals throw before any side effect.
  if (total <= 0) throw new CheckoutError(total);
  // => Named throw: the snapshot names the class plus the frozen message.
  return "ok";
}

// => Error contract: class from the matcher, message from the snapshot.
test("empty checkout throws the frozen error", async () => {
  // => Error contract: class from the matcher, message from the snapshot.
  expect(() => checkout(0)).toThrowErrorMatchingSnapshot(CheckoutError);
  // => Class argument plus snapshot: contract and copy frozen together.
  // => First run writes the message; later runs compare it byte for byte.
  // => Message edits become diffs: copy changes get reviewed like code.
});
