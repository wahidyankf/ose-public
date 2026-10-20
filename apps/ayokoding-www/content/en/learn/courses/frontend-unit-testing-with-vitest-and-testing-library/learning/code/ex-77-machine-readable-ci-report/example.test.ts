// => Runner imports only: the JSON report below counts exactly these two.
import { expect, test } from "vitest";
// => Two tiny cases: the JSON report below counts exactly these two.

// => Trivially true: the report counts cases, not their cleverness.
test("one plus one is two", async () => {
  // => Trivially true: the report counts cases, not their cleverness.
  expect(1 + 1).toBe(2);
});

// => Second case: the parser below must report tests: 2, passed: 2.
test("two plus two is four", async () => {
  // => Second case: the parser below must report tests: 2, passed: 2.
  expect(2 + 2).toBe(4);
  // => Second case closes: the pair the machine-readable report counts.
});
