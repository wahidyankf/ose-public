/// <reference path="./node.d.ts" />
// => Example 37 file 2: beforeEach rebuilds the roster, so cases never share state.
import { describe, it, beforeEach } from "node:test"; // => runner plus fixture hook
import { deepStrictEqual } from "node:assert/strict"; // => structural assertions
import { Roster } from "./main.js"; // => roster under test
describe("Roster", () => {
  // => one group for the roster
  let roster: Roster; // => fresh fixture per case
  beforeEach(() => {
    // => WHY beforeEach: no case inherits another's state
    roster = new Roster(); // => reset before every case
  }); // => end of beforeEach(() =>
  it("starts empty", () => {
    // => first behavior
    deepStrictEqual(roster.list(), []); // => empty snapshot
  }); // => end of it("starts empty", () =>
  it("lists added members in order", () => {
    // => second behavior
    roster.add("ada"); // => arrange one member
    roster.add("grace"); // => arrange another
    deepStrictEqual(roster.list(), ["ada", "grace"]); // => insertion order kept
  }); // => end of it("lists added members in order", () =>
}); // => end of describe("Roster", () =>
