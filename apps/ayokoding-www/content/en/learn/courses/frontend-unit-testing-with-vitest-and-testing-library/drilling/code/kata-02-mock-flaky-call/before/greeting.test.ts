// @vitest-environment jsdom
// => Pragma harmless here: pure logic, but katas share the course shape.

import { expect, test } from "vitest";
// => One assertion: the whole suite is a single fragile claim.

import { greeting } from "./greeting";
// => Subject: the clock-reading function.

test("before: morning greeting", () => {
  // => Fragile claim: true before noon, false after -- calendar roulette.
  expect(greeting()).toBe("good morning");
  // => Hope-based: passes when the author runs it, fails on night-shift CI.
});
