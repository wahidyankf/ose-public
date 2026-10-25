// @vitest-environment jsdom
// => Pragma shared: katas keep the course shape even for pure logic.

import { expect, test } from "vitest";
// => One assertion: the echoed value after the real delay.

import { delayedEcho } from "./delay";
// => Subject: the setTimeout promise.

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(() => resolve(), ms);
  });
// => Sleep helper: the wall-clock wait this kata eliminates.

test("before: real 300ms wait for a real 300ms timer", async () => {
  // => Starting point: green in 300ms, slower with every timer added.
  const pending = delayedEcho("ready", 300);
  // => Start the timer: the value arrives after the real delay.
  await delay(350);
  // => Wall-clock wait: 50ms of margin against a loaded machine.
  expect(await pending).toBe("ready");
  // => Value arrives: correct, and paid for in full.
});
