// Example 42: Retrying Only the Flaky Step. (co-10: retry-policy, co-04: page-object)
// => Playwright 1.60.0, docs accessed 2026-10-20; when one step (coupon
// => apply) flakes while the rest is solid, retry the step inside the test
// => instead of retrying the whole test: faster, and the retry stays visible
// => next to the step it protects:
// =>   real: await expect(async () => { await page.getByRole("button", { name: "Apply" }).click(); ... }).toPass();
async function main(): Promise<void> {
  // => entry point for the step-retry check
  const attempts: number[] = [0]; // => how many times the step ran, by reference
  const total: string = retryStep(attempts, 1); // => the coupon step fails once, then passes
  console.log("attempts: " + String(attempts[0])); // => Output: attempts: 2
  console.log("total: " + total); // => Output: total: $2.40
  console.log("step retried, test did not: " + String(attempts[0] === 2)); // => Output: step retried, test did not: true
  const steady: number[] = [0]; // => a solid step never needs a second try
  retryStep(steady, 0); // => passes on the first attempt
  console.log("solid step runs once: " + String(steady[0] === 1)); // => Output: solid step runs once: true
} // => main ends; the retry stayed inside the flaky step

function flakyCouponStep(attempts: number[], failFirst: number): string {
  // => the step under test
  attempts[0] = (attempts[0] as number) + 1; // => count this attempt
  if ((attempts[0] as number) <= failFirst) {
    // => the first attempts fail
    throw new Error("coupon service hiccup"); // => a transient backend fault
  } // => later attempts proceed
  return "$2.40"; // => the discounted total
} // => flakyCouponStep fails, then recovers

function retryStep(attempts: number[], failFirst: number): string {
  // => stand-in for expect().toPass()
  const budget = 3; // => at most three tries for this step
  for (let i = 0; i < budget; i++) {
    // => one iteration per attempt
    try {
      // => the step may fail transiently
      return flakyCouponStep(attempts, failFirst); // => success returns immediately
    } catch {
      // => transient failure: try again
      continue; // => next attempt
    } // => catch ends
  } // => budget exhausted
  throw new Error("step failed after retries"); // => genuinely broken, fail loudly
} // => retryStep bounds the step's patience

await main(); // => run once; a failure throws and exits nonzero
