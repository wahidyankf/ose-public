import { expect, test } from "vitest";
// => Runner imports only: scoping needs no test-side changes at all.

import { cartTotal } from "./cart";
// => Import only the measured module: the legacy file stays out of the suite.

test("totals the new cart module", async () => {
  // => One behavior for the one measured file: scope and suite agree.
  expect(cartTotal([10, 20])).toBe(30);
  // => The table below shows cart.ts at 100: legacy.ts absent by config.
  // => Absence is the point: unscored files cannot drag or flatter the number.
});
