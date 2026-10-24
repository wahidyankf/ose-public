/// <reference path="./node.d.ts" />
// => Example 40 file 2: mock.fn records calls; the test asserts what it saw.
import { describe, it, mock } from "node:test"; // => runner plus the mock namespace
import { strictEqual } from "node:assert/strict"; // => scalar assertions
import { notify } from "./main.js"; // => fan-out under test
describe("notify", () => {
  // => one group for fan-out
  it("calls every listener once with the message", () => {
    // => the core behavior
    const first = mock.fn((msg: string) => undefined); // => first recorder
    const second = mock.fn((msg: string) => undefined); // => second recorder
    notify([first, second], "hi"); // => fan out one message
    strictEqual(first.mock.calls.length, 1); // => first called exactly once
    strictEqual(second.mock.calls.length, 1); // => second called exactly once
    strictEqual(first.mock.calls[0].arguments[0], "hi"); // => message arrived intact
  }); // => end of it("calls every listener once with the message", ()
}); // => end of describe("notify", () =>
