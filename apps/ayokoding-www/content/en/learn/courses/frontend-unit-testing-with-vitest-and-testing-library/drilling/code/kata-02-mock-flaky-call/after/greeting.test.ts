// @vitest-environment jsdom
// => Pragma harmless here: pure logic, but katas share the course shape.

import { expect, test } from "vitest";
// => Two assertions: both branches, no clock, no calendar.

import { greetingAt } from "./greeting";
// => Subject: the pure core, hours injected as plain numbers.

test("after: both greetings from injected hours", () => {
  // => Deterministic: 9 and 15 behave the same at every hour of the day.
  expect(greetingAt(9)).toBe("good morning");
  // => Morning branch: the case the old test could only hope for.
  expect(greetingAt(15)).toBe("good afternoon");
  // => Afternoon branch: previously untestable without waiting for noon.
});
