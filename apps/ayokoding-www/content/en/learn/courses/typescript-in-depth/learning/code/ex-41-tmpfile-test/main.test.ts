/// <reference path="./node.d.ts" />
// => Example 41 file 2: the test owns its scratch file and removes it after.
import { test } from "node:test"; // => standalone case
import { deepStrictEqual } from "node:assert/strict"; // => structural assertions
import { join } from "node:path"; // => scratch path
import { tmpdir } from "node:os"; // => scratch root
import { rmSync } from "node:fs"; // => cleanup
import { save, load } from "./main.js"; // => store under test
test("round-trips rows through scratch", () => {
  // => one behavior
  const scratch = join(tmpdir(), "ex41-store.txt"); // => fixed scratch name, never printed
  save(scratch, ["ada", "grace"]); // => arrange through the store itself
  deepStrictEqual(load(scratch), ["ada", "grace"]); // => rows survive the trip
  rmSync(scratch, { force: true }); // => no trace left
}); // => end of test("round-trips rows through scratch", () =>
