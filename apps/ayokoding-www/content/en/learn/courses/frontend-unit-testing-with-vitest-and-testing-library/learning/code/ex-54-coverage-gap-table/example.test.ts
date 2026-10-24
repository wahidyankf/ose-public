import { expect, test } from "vitest";
// => Runner imports only: the coverage flags live in the run command.

import { shippingFee } from "./shipping";
// => Subject by relative import: module and spec side by side, as usual.

test("standard shipping costs five", async () => {
  // => One behavior tested of three: the gap below is deliberate and visible.
  expect(shippingFee(50, false)).toBe(5);
  // => Only the fallthrough line runs: both if-branches stay uncovered.
  // => The coverage table will report the gap in numbers, not adjectives.
});
