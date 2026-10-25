/// <reference path="./node.d.ts" />
// => Example 38 file 2: one top-level test with a subtest per step.
import { test } from "node:test"; // => top-level case with context
import { strictEqual } from "node:assert/strict"; // => scalar assertions
import { parseLogin, checkLogin, greet } from "./main.js"; // => steps under test
test("login flow", async (t) => {
  // => WHY subtests: steps report separately, run together
  await t.test("parses by trimming", () => {
    // => step one as a subtest
    strictEqual(parseLogin("  ada  "), "ada"); // => padding removed
  }); // => end of await t.test("parses by trimming", () =>
  await t.test("checks the length policy", () => {
    // => step two as a subtest
    strictEqual(checkLogin("ada"), true); // => three chars pass
  }); // => end of await t.test("checks the length policy", () =>
  await t.test("greets with the template", () => {
    // => step three as a subtest
    strictEqual(greet("ada"), "hi, ada"); // => template filled
  }); // => end of await t.test("greets with the template", () =>
}); // => end of test("login flow", async (t) =>
