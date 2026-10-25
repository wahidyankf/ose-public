/// <reference path="./node.d.ts" />
// => Example 43 file 2: skip parks hard cases; todo plans unwritten ones.
import { describe, it, test } from "node:test"; // => runner plus top-level variants
import { strictEqual } from "node:assert/strict"; // => scalar assertions
import { Stack } from "./main.js"; // => stack under test
describe("Stack", () => {
  // => one group for the stack
  it("pushes and pops in order", () => {
    // => the live behavior
    const s = new Stack(); // => fresh stack
    s.push(1); // => arrange
    s.push(2); // => arrange more
    strictEqual(s.pop(), 2); // => last in, first out
    strictEqual(s.size, 1); // => one member left
  }); // => end of it("pushes and pops in order", () =>
  it.skip("persists across restarts", () => {
    // => WHY skip: needs a store this course never builds
    strictEqual(1, 1); // => parked body, never runs
  }); // => end of it.skip("persists across restarts", () =>
}); // => end of describe("Stack", () =>
test.todo("emits drain events"); // => WHY todo: planned, honestly unwritten
