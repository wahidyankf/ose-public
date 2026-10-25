import { expect, test, vi } from "vitest";
// => vi namespace again: implementations and rejections extend the recorder.

// => Pricing rule: sum minus per-item discount, strategy injected for tests.
function totalWithDiscount(
  prices: number[], // => Basket lines: the reduce below visits each one exactly once.
  discount: (price: number) => number, // => Policy as a function: the mock scripts its answers per price.
): number {
  // => Returns a plain number: no options, no nulls, the total always defined.
  // => Discount strategy arrives as a function: computed answers fit naturally.
  // => Strategy-as-parameter keeps the unit pure: the mock supplies the policy.
  return prices.reduce((sum, price) => sum + price - discount(price), 0);
  // => Reduce threads the strategy through every price: branch per element.
}

test("implementation computes per-input answers", async () => {
  // => The mock decides from its input: ten percent off, computed live.
  const discount = vi.fn((price: number) => (price > 100 ? 20 : 5));
  // => Implementation in the constructor: default answer for every call.
  // => Branch inside the mock mirrors the policy the unit must handle.
  const total = totalWithDiscount([50, 200], discount);
  // => Mixed basket: one cheap item, one expensive, both branches exercised.
  expect(total).toBe(50 - 5 + (200 - 20));
  // => Arithmetic spelled out: 45 + 180 = 225, each discount visible.
  expect(discount).toHaveBeenCalledTimes(2);
  // => Once per price: the reduce contract, proved by the count.
});

// => Failure path next: the same recorder scripts a rejection for the catch branch.
test("rejected promises surface through rejects", async () => {
  // => Async failure needs its own idiom: rejects unwraps the thrown error.
  const failing = vi.fn().mockRejectedValue(new Error("warehouse down"));
  // => mockRejectedValue scripts a promise that always rejects with this error.
  // => Chained off a bare vi.fn(): record plus reject in one expression.
  const outcome = (async (): Promise<string> => {
    // => Tiny inline unit: calls the collaborator, labels the failure mode.
    try {
      await failing("rice-1kg");
      // => Awaited call throws inside try: the catch below translates it.
      return "in stock";
      // => Bare catch: the test asserts the translated label, not the raw error.
    } catch {
      // => Bare catch: the test asserts the message separately, precisely.
      return "unavailable";
    }
  })();
  // => Immediately invoked: the promise under test exists before assertions.
  await expect(outcome).resolves.toBe("unavailable");
  // => resolves unwraps: the translated label, not the raw warehouse error.
  // => rejects would assert a thrown error; resolves asserts a handled one.
  expect(failing).toHaveBeenCalledWith("rice-1kg");
  // => The collaborator still recorded its call: failure observed, then handled.
});
