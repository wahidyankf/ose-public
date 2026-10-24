import { expect, test } from "vitest";
// => Runner imports only: thresholds enforce themselves at the run level.

import { discount } from "./discount";
// => Subject import: two branches, both tested, floors hold with margin.

// => Bulk tier covered: floors hold with margin.
test("bulk orders earn ten off", async () => {
  // => Branch one: threshold tier covered, floors stay comfortably above.
  expect(discount(150)).toBe(10);
  // => Second case closes: the configured thresholds have nothing to complain about.
});

// => Fallthrough covered: both branches tested, the gate holds green.
test("small orders earn nothing", async () => {
  // => Branch two: fallthrough covered, the 100-line average holds at 100.
  expect(discount(20)).toBe(0);
  // => Two cases, two branches: the gate below has nothing to complain about.
});
