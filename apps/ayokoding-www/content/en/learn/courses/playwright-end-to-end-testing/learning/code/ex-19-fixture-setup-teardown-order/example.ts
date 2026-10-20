// Example 19: Fixture Setup and Teardown Order. (co-03: fixture)
// => Playwright 1.60.0, docs accessed 2026-10-20; everything before use()
// => in a fixture is setup, everything after is teardown; teardown runs even
// => when the test fails, so browsers close and temp data is removed:
// =>   real: await use(page); await page.close(); // teardown after use
async function main(): Promise<void> {
  // => entry point for the ordering check
  const log: string[] = []; // => the lifecycle record, in order
  await runTest(log, "adds milk", async () => {
    // => one test with logging hooks
    log.push("test body"); // => the test itself runs between setup and teardown
  }); // => teardown recorded after the body
  console.log("order: " + log.join(" > ")); // => Output: order: setup page > test body > teardown page
  console.log("setup first: " + String(log[0] === "setup page")); // => Output: setup first: true
  console.log("teardown last: " + String(log[log.length - 1] === "teardown page")); // => Output: teardown last: true
  const failing: string[] = []; // => a second record for a failing test
  try {
    // => the failing test throws; the record keeps the teardown proof
    await runFailingTest(failing); // => the test throws, teardown must still run
  } catch {
    // => the failure is expected here
    failing.push("test failed"); // => record the failure after teardown ran
  } // => failure absorbed; teardown already recorded
  console.log("teardown after failure: " + String(failing.includes("teardown page"))); // => Output: teardown after failure: true
} // => main ends; teardown ran in both cases

async function runTest(log: string[], _name: string, body: () => Promise<void>): Promise<void> {
  // => stand-in for test()
  log.push("setup page"); // => fixture setup: build the page
  await body(); // => the test body runs
  log.push("teardown page"); // => fixture teardown: close the page
} // => runTest records the passing lifecycle

async function runFailingTest(log: string[]): Promise<void> {
  // => stand-in for a failing test
  log.push("setup page"); // => setup still runs first
  try {
    // => the body throws below
    throw new Error("cart total wrong"); // => the test fails here
  } finally {
    // => teardown is unconditional
    log.push("teardown page"); // => teardown runs despite the failure
  } // => finally ends
} // => runFailingTest proves teardown is failure-proof

await main(); // => run once; a failure throws and exits nonzero
