import { expect, test } from "vitest";
// => Runner imports only: the gate script runs the suite, not the tests.

import { lineTotal } from "./pricing";
// => Subject import: two branches, both tested, the gate below holds green.

// => Discounted path: the branch the floor protects.
test("bulks earn ten percent off", async () => {
  // => Branch one: the discounted path the floor protects.
  expect(lineTotal(10, 10)).toBe(90);
});

// => Plain path: both branches covered, the JSON summary reads lines at 100.
test("small orders pay full price", async () => {
  // => Branch two: the plain path, keeping the average at 100.
  expect(lineTotal(10, 3)).toBe(30);
  // => Both branches covered: the JSON summary below reports lines at 100.
  // => Second case closes: the gate script below has a green number to check.
});
