import { beforeEach, expect, test } from "vitest";
// => beforeEach resets the shared module before every case, guaranteed.

import { addItem, basket, clearBasket } from "./basket";
// => Live bindings: the tests observe the SAME array the module mutates.

// => Reset through the module's own helper: no test reaches into internals.
beforeEach(() => {
  clearBasket();
  // => Reset through the module's own helper: no test reaches into internals.
  // => Runs before EVERY case: order independence, not order luck.
});

test("first case sees one item", async () => {
  // => Count one: passes with or without the hook, the baseline.
  expect(addItem("Rice")).toBe(1);
  // => Push returns the new length: 1 in a freshly cleared basket.
});

// => The order-independence proof: fails without the hook, passes with it.
test("second case also sees one item", async () => {
  // => THE order-independence proof: fails without the hook (would see 2).
  // => Run this case alone (-t) AND after the first: identical results both ways.
  expect(addItem("Oil")).toBe(1);
  // => Count one again: the hook cleared Rice before this case started.
  expect(basket).toEqual(["Oil"]);
  // => Basket contents pinned: exactly this case's item, nothing carried over.
});
