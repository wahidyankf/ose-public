import { expect, test } from "vitest";
// => No new API: skip is a property on the test function you already know.

function refund(total: number): number {
  // => A half-built feature: the happy path works, the edge case is unwritten.
  // => Committing the passing half with a skip beats a commented-out test file.
  return total;
  // => Stub body: returns the input until the fee schedule lands.
}

test("refunds the full total", async () => {
  // => The finished case guards what already works, as usual.
  expect(refund(100)).toBe(100);
  // => Green today, and it will catch regressions while the feature grows.
});

test.skip("deducts the restocking fee", async () => {
  // => .skip registers the case AND marks it pending: visible, not run.
  // => The runner counts it as skipped, so dashboards track the debt.
  // => Prefer skip over commenting out: comments are invisible to tooling.
  expect(refund(100)).toBe(95);
  // => The assertion states the intended behavior before the code exists.
  // => When the fee lands, removing .skip turns intent into a live check.
  // => Never commit test.only: it silences the rest of the file for everyone.
});
