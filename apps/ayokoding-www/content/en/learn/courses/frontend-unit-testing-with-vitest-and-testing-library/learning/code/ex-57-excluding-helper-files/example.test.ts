import { expect, test } from "vitest";
// => Runner imports only: exclusion needs no test-side API at all.

import { label } from "./pricing";
// => Import the product function: the helper rides along, unscored.

test("labels a fixture in upper case", async () => {
  // => One behavior, one case: the product file hits 100, helpers excluded.
  expect(label("rice")).toBe("FIXTURE-RICE");
  // => Helper output transformed: the product logic proved, helper invisible.
  // => The table below lists pricing.ts only: helpers.ts is gone by config.
});
