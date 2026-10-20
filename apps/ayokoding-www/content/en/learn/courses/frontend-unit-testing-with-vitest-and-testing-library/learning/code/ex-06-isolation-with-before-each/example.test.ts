import { beforeEach, expect, test } from "vitest";
// => beforeEach joins the imports: setup hooks are runner vocabulary too.
// => Hooks run around cases; they never contain assertions of their own.

let attempts: string[];
// => Shared mutable state on purpose: the hook below tames it.
// => Module-level let is the simplest fixture a hook can reset.
// => Real suites share page objects or stores; the pattern is identical.

beforeEach(() => {
  // => This hook runs before EACH case, in order, even when one case fails.
  attempts = [];
  // => Reassign a fresh array: no case ever sees another case's entries.
  // => Fresh assignment beats .length = 0: aliases cannot smuggle state.
});

function record(attempt: string): number {
  // => The unit under test appends to the shared log and reports its size.
  // => Stateful units are exactly the ones that need hook-guarded fixtures.
  attempts.push(attempt);
  // => Push mutates shared state: without the hook, counts would accumulate.
  return attempts.length;
  // => Returning the size makes the leak observable in the very next case.
}

test("first case sees exactly one entry", async () => {
  // => Each case assumes a pristine log: the hook, not luck, provides it.
  expect(record("login")).toBe(1);
  // => Count 1 proves the log started empty for THIS case.
});

test("second case also starts empty", async () => {
  // => This is the case that fails without beforeEach: it would see 2.
  // => Order-dependent suites fail only in full runs, never in isolation.
  expect(record("checkout")).toBe(1);
  // => Count 1 again: the hook ran between the two cases, guaranteed.
  // => Two identical expectations in a row are the isolation proof itself.
});
