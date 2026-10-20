// Example 68: Random Order Exposes Coupling. (co-15: flakiness-diagnosis, co-09: test-isolation)
// => Playwright 1.60.0, docs accessed 2026-10-20; --repeat-each plus random
// => file order (workers shuffle) surfaces tests that pass only in one
// => sequence; a test green alone and red after another test is coupled to
// => it, not flaky:
// =>   real: npx playwright test --repeat-each=3 (same file, fresh context each time)
async function main(): Promise<void> {
  // => entry point for the coupling check
  const orderA: boolean = runOrder(["maker", "taker"]); // => maker seeds, taker consumes: green
  const orderB: boolean = runOrder(["taker", "maker"]); // => taker first finds nothing: red
  console.log("order A green: " + String(orderA)); // => Output: order A green: true
  console.log("order B green: " + String(orderB)); // => Output: order B green: false
  console.log("coupled, not flaky: " + String(orderA && !orderB)); // => Output: coupled, not flaky: true
  console.log("fix: isolate the coupon: " + String(!orderB)); // => Output: fix: isolate the coupon: true
} // => main ends; the order proved the coupling

function runOrder(tests: string[]): boolean {
  // => stand-in for one suite order
  let coupons = 0; // => the backend starts empty
  for (const test of tests) {
    // => run each test in this order
    if (test === "maker") {
      // => the maker test seeds one coupon
      coupons += 1; // => one coupon available now
    } // => maker ends
    if (test === "taker") {
      // => the taker test consumes one coupon
      if (coupons === 0) {
        // => nothing seeded yet in this order
        return false; // => red: the taker depends on the maker's residue
      } // => available branch
      coupons -= 1; // => consume the seeded coupon
    } // => taker ends
  } // => every test ran
  return true; // => green in this order
} // => runOrder replays one permutation

await main(); // => run once; a failure throws and exits nonzero
