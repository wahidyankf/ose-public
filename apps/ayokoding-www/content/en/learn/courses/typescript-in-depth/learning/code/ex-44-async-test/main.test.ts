/// <reference path="./node.d.ts" />
// => Example 44 file 2: async cases await the loader; rejects covers the failure path.
import { describe, it } from "node:test"; // => the standard runner pair
import { deepStrictEqual, rejects } from "node:assert/strict"; // => structural plus rejection assertions
import { loadRows, loadClosed } from "./main.js"; // => loaders under test
describe("loadRows", () => {
  // => one group for the loader
  it("resolves both rows", async () => {
    // => WHY async it: await the loader
    deepStrictEqual(await loadRows(), [{ id: 1 }, { id: 2 }]); // => rows arrive whole
  }); // => end of it("resolves both rows", async () =>
  it("rejects when closed", async () => {
    // => failure path awaited too
    await rejects(() => loadClosed(), /closed/); // => message matches
  }); // => end of it("rejects when closed", async () =>
}); // => end of describe("loadRows", () =>
