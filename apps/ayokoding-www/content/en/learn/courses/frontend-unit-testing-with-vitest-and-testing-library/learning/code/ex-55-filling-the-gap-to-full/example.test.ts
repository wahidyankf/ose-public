import { expect, test } from "vitest";
// => Runner imports only: three behaviors, three cases, one table at 100.

import { shippingFee } from "./shipping";
// => Same subject as Example 54: compare the two tables side by side.

// => Branch one: the threshold line the previous suite never executed.
test("orders over 100 ship free", async () => {
  // => Branch one: the threshold line the previous suite never executed.
  expect(shippingFee(120, false)).toBe(0);
  // => Free even without express: threshold dominates, asserted exactly.
});

// => Branch two: the surcharge line the previous suite never executed.
test("express orders under 100 cost fifteen", async () => {
  // => Branch two: the surcharge line the previous suite never executed.
  expect(shippingFee(50, true)).toBe(15);
  // => Express flag honored only below the free threshold: both inputs matter.
});

// => Branch three: the fallthrough the old suite already covered.
test("standard orders cost five", async () => {
  // => Branch three: the fallthrough the old suite already covered.
  expect(shippingFee(50, false)).toBe(5);
  // => Kept, not replaced: filling gaps adds cases, never rewrites old ones.
});
