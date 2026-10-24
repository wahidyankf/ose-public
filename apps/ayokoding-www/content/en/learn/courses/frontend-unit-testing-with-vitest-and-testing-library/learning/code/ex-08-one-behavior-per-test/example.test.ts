import { expect, test } from "vitest";
// => Back to the two-import minimum: structure, not API, is the lesson.

type Cart = { items: string[]; coupon: string | null };
// => A tiny domain type: a cart with items and an optional coupon code.
// => The type makes the two behaviors below visible before any test runs.

function total(items: string[]): number {
  // => Pricing rule, simplified: every item costs 10, no exceptions here.
  // => A pure function: the easiest possible subject for behavior-per-test.
  return items.length * 10;
  // => Length times price: one behavior, one line, one future test.
}

function couponLabel(coupon: string | null): string {
  // => Display rule: a missing coupon must say so plainly, never crash.
  // => Null handling is a separate behavior from pricing: separate test.
  if (coupon === null) return "No coupon applied";
  // => The null branch is the behavior this second test will pin.
  return `Coupon ${coupon} applied`;
  // => Template literal keeps the code visible in the receipt string.
}

test("prices three items at thirty", async () => {
  // => One behavior: pricing. No coupon logic appears in this case at all.
  expect(total(["a", "b", "c"])).toBe(30);
  // => A single assertion: when it fails, pricing broke, full stop.
});

test("labels a missing coupon plainly", async () => {
  // => One behavior: null display. No pricing math appears here either.
  // => Splitting behaviors means splitting failure stories: priceless later.
  expect(couponLabel(null)).toBe("No coupon applied");
  // => The string is pinned so UI copy changes become deliberate diffs.
});
