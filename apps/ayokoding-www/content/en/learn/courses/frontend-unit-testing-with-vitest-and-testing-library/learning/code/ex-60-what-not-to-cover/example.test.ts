import { expect, test } from "vitest";
// => Runner imports only: this example argues by counterexample, in prose.

type Settings = { theme: string; retries: number };
// => Settings shape: one trivial accessor plus one real decision below.

function theme(settings: Settings): string {
  // => Trivial accessor: returns a field, decides nothing, breaks nowhere.
  // => Covering this line proves the test runner works, not the product.
  return settings.theme;
}

// => Real decision: exponential backoff with a cap, branchy and load-bearing.
function backoff(retries: number): number {
  // => Real decision: exponential backoff with a cap, branchy and load-bearing.
  // => Retry timing decides outage behavior: THIS deserves the test budget.
  if (retries <= 0) return 0;
  // => No-retry path: base case, one branch, pinned below.
  const wait = 100 * 2 ** retries;
  // => Exponential growth: 200, 400, 800... the formula under test.
  return Math.min(wait, 5000);
  // => Cap at five seconds: the second branch, the one outages hinge on.
}

test("caps exponential backoff at five seconds", async () => {
  // => Budget spent on the decision: the cap branch is the outage behavior.
  expect(backoff(10)).toBe(5000);
  // => 100 * 2^10 capped: without the cap this returns 102400, outage-sized.
  expect(backoff(1)).toBe(200);
  // => Uncapped path pinned too: the formula, not just its ceiling.
  expect(theme({ theme: "dark", retries: 0 })).toBe("dark");
  // => Accessor asserted incidentally: one line, zero ceremony, no coverage cult.
  // => The point: this last line is FINE, it just is not the reason to test.
});
