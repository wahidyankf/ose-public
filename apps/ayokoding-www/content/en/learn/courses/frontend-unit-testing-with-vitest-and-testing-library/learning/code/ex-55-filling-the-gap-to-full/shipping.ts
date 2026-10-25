export function shippingFee(total: number, express: boolean): number {
  // => Identical module as Example 54: the code did not change, only the suite.
  // => Same three behaviors: free over 100, express surcharge, standard five.
  if (total >= 100) return 0;
  // => Free threshold: Example 54 never took this branch; now it gets a case.
  if (express) return 15;
  // => Express surcharge: second uncovered branch, second new case below.
  return 5;
  // => Standard fee: the one line the old suite already covered.
}
