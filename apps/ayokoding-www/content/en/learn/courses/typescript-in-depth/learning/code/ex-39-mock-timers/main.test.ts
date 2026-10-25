/// <reference path="./node.d.ts" />
// => Example 39 file 2: the fake clock advances time synchronously; no test ever waits.
import { describe, it, mock } from "node:test"; // => runner plus the mock namespace
import { strictEqual } from "node:assert/strict"; // => scalar assertions
import { debounce } from "./main.js"; // => debounce under test
describe("debounce", () => {
  // => one group for the debounce
  it("fires once after quiet", () => {
    // => the core behavior
    mock.timers.enable({ apis: ["setTimeout"], now: 1000 }); // => WHY fake clock: no real waiting
    let calls = 0; // => manual counter
    const fire = debounce(() => {
      calls += 1;
    }, 50); // => 50ms debounce
    fire(); // => first call schedules
    fire(); // => second call resets the wait
    mock.timers.tick(50); // => advance past the wait synchronously
    strictEqual(calls, 1); // => exactly one firing
    mock.timers.reset(); // => restore the real timers
  }); // => end of it("fires once after quiet", () =>
}); // => end of describe("debounce", () =>
