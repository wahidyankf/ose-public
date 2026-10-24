/// <reference path="./node.d.ts" />
// => Kata 2 solution file 2: the wish written as tests; the fix makes them green.
import { describe, it } from "node:test"; // => the standard runner pair
import { strictEqual } from "node:assert/strict"; // => scalar assertions
import { total } from "./solution.js"; // => helper under test
describe("total", () => {
  // => one group for the helper
  it("sums price times qty", () => {
    // => the wish that caught the bug
    strictEqual(
      total([
        { price: 25, qty: 2 },
        { price: 3, qty: 1 },
      ]),
      53,
    ); // => 50 + 3
  }); // => end of it("sums price times qty", () =>
  it("totals nothing for no lines", () => {
    // => the empty edge
    strictEqual(total([]), 0); // => zero lines, zero total
  }); // => end of it("totals nothing for no lines", () =>
}); // => end of describe("total", () =>
