// @vitest-environment jsdom
// => Pragma shared: katas keep the course shape even for pure logic.

import { expect, test } from "vitest";
// => One assertion: the guest path, the only covered one.

import { totalWithFee } from "./fees";
// => Subject: the two-branch fee rule.

test("before: guest total adds the fee", () => {
  // => Starting point: green, and quietly half-blind.
  expect(totalWithFee(10, false)).toBe(12);
  // => Guest path: covered. The member path runs in production, untested.
});
