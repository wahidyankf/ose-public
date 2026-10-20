// => Shared mutable list: the order-dependence hazard, stated up front.
export const basket: string[] = [];
// => Module-level mutable list: shared across cases in one file, the hazard.
// => Shared by import reference: every test file gets the SAME array object.

// => Appends and reports size: the count leaks across cases without a reset.
export function addItem(item: string): number {
  // => Appends and reports size: the count leaks across cases without a reset.
  basket.push(item);
  return basket.length;
}

// => Reset helper: the beforeEach below calls this, never reaches inside.
export function clearBasket(): void {
  // => Reset helper: the beforeEach below calls this, never reaches inside.
  // => Exported reset beats test-only surgery: production owns its cleanup.
  basket.length = 0;
}
