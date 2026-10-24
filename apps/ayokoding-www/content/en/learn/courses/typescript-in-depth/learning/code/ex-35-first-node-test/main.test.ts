/// <reference path="./node.d.ts" />
// => Example 35 file 2: describe groups cases; it holds one behavior each.
import { describe, it } from "node:test"; // => the standard runner pair
import { strictEqual } from "node:assert/strict"; // => the standard assertions
import { add, mul } from "./main.js"; // => helpers under test
describe("calc", () => {
  // => WHY describe: one group per unit under test
  it("adds two numbers", () => {
    // => first behavior
    strictEqual(add(2, 3), 5); // => 2 + 3 is 5
  }); // => end of it("adds two numbers", () =>
  it("multiplies two numbers", () => {
    // => second behavior
    strictEqual(mul(2, 3), 6); // => 2 * 3 is 6
  }); // => end of it("multiplies two numbers", () =>
  it("adds negatives", () => {
    // => third behavior, the edge
    strictEqual(add(-2, -3), -5); // => signs survive
  }); // => end of it("adds negatives", () =>
}); // => end of describe("calc", () =>
