// Example 10: Replace Fixed Sleep With Expect. (co-02: auto-waiting)
// => Playwright 1.60.0, docs accessed 2026-10-20; waitForTimeout sleeps
// => blindly: too short flakes, too long wastes minutes across a suite.
// => expect(locator).toBeVisible() polls the condition and returns the tick
// => it turned true, which is fast when the app is fast and patient when not:
// =>   real: await expect(page.getByText("Saved")).toBeVisible();
async function main(): Promise<void> {
  // => entry point for the wait comparison
  const appearsAt: number = 3; // => the Saved toast renders at tick 3
  const slept: number = fixedSleep(10); // => real: await page.waitForTimeout(10_000)
  console.log("fixed sleep cost ticks: " + String(slept)); // => Output: fixed sleep cost ticks: 10
  const waited: number = waitForVisible(appearsAt, 10); // => real: await expect(toast).toBeVisible()
  console.log("condition met at tick: " + String(waited)); // => Output: condition met at tick: 3
  console.log("saved waiting: " + String(slept - waited)); // => Output: saved waiting: 7
  console.log("faster and safer: " + String(waited < slept)); // => Output: faster and safer: true
} // => main ends; the condition beat the clock by 7 ticks

function fixedSleep(ticks: number): number {
  // => stand-in for waitForTimeout
  return ticks; // => sleeping always costs the full duration, blind to the app
} // => fixedSleep wastes the whole budget

function waitForVisible(appearsAt: number, timeout: number): number {
  // => stand-in for expect().toBeVisible()
  for (let tick = 0; tick <= timeout; tick++) {
    // => poll once per tick
    if (tick >= appearsAt) {
      // => the toast is visible from its tick on
      return tick; // => return the moment it turned true
    } // => not yet visible
  } // => timeout exhausted
  return -1; // => real Playwright throws expect.toBeVisible timed out
} // => waitForVisible returns the first true tick

await main(); // => run once; a failure throws and exits nonzero
