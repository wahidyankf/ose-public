// @vitest-environment jsdom
// => Pragma shared: katas keep the course shape even for pure logic.

import { expect, test } from "vitest";
// => Two assertions: one per branch, the gap closed.

import { totalWithFee } from "./fees";
// => Subject: unchanged function, fully exercised suite.

test("after: member skips the fee, guest pays it", () => {
  // => Target: both branches pinned, the table reads full.
  expect(totalWithFee(10, true)).toBe(10);
  // => Member path: the line coverage flagged, now asserted.
  expect(totalWithFee(10, false)).toBe(12);
  // => Guest path: kept, the old test survives inside the new one.
});
