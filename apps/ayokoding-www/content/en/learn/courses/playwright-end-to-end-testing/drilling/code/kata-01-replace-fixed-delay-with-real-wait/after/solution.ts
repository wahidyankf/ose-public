// Kata 1 solution: wait for the toast (condition), not the clock. The wait
// returns at tick 3, saving 7 ticks over the starter every single run.
// (co-02: auto-waiting)
async function main(): Promise<void> {
  // => entry point
  const toastAt = 3; // => the toast renders at tick 3
  const landed: number = waitForVisible(toastAt, 10); // => real: await expect(toast).toBeVisible()
  console.log("passes: " + String(landed === toastAt)); // => Output: passes: true
  console.log("cost ticks: " + String(landed)); // => Output: cost ticks: 3
  console.log("saved: " + String(10 - landed)); // => Output: saved: 7
} // => the condition beat the clock

function waitForVisible(appearsAt: number, timeout: number): number {
  // => stand-in for expect().toBeVisible()
  for (let tick = 0; tick <= timeout; tick++) {
    // => poll once per tick
    if (tick >= appearsAt) {
      // => visible from its tick on
      return tick; // => return the first true tick
    } // => not yet visible
  } // => timeout exhausted
  return -1; // => real Playwright throws expect.toBeVisible timed out
} // => waitForVisible returns the landing tick or -1

await main(); // => run once
