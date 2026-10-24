import { expect, test } from "vitest";
// => Runner vocabulary stays at two imports: matchers do all the new work.

function discountRate(orders: number): number | null {
  // => A nullable return models real business rules: no history, no discount.
  // => The union type forces every caller, and this test, to handle null.
  if (orders <= 0) return null;
  // => Guard clause first: the degenerate input gets the degenerate output.
  return 0.1 + 0.2;
  // => Deliberately naive math: 0.1 + 0.2 is NOT exactly 0.3 in floats.
  // => Real code would use integer cents; the imprecision here is the lesson.
}

test("null means no discount, not zero discount", async () => {
  // => Null and zero must stay distinct: one means unknown, one means none.
  expect(discountRate(0)).toBeNull();
  // => toBeNull matches only null, never undefined and never zero.
  // => toBeFalsy would also pass for 0 and '', hiding the distinction.
  expect(discountRate(0)).not.toBe(0);
  // => No toBeZero exists in Vitest; not.toBe(0) states the same claim exactly.
  // => Pairing the null check with the zero check pins the boundary.
});

test("float math needs an epsilon comparison", async () => {
  // => 0.1 + 0.2 === 0.30000000000000004, so toBe(0.3) would fail here.
  expect(discountRate(5)).toBeCloseTo(0.3, 10);
  // => toBeCloseTo compares within half a unit of the last decimal place.
  // => Precision 10 is strict; money code usually wants precision 2.
  // => The matcher name tells the reader floats are approximate by nature.
});

test("defined and truthy guard the happy path", async () => {
  // => Definedness checks catch missing fields before deeper assertions run.
  const rate = discountRate(5);
  // => Bind once, assert twice: the value under test stays identical.
  expect(rate).toBeDefined();
  // => toBeDefined rejects only undefined: null and 0 both pass it.
  expect(rate).toBeGreaterThan(0);
  // => A range assertion beats an exact one for values math may perturb.
});
