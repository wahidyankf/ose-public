// Example 15: Custom Poll Timeout. (co-02: auto-waiting)
// => Playwright 1.60.0, docs accessed 2026-10-20; the default timeout fits
// => ordinary renders; a slow chart or cold backend gets its own longer
// => timeout on that one assertion, never a global raise that hides every
// => other regression behind patience:
// =>   real: await expect(chart).toBeVisible({ timeout: 10_000 });
async function main(): Promise<void> {
  // => entry point for the timeout comparison
  const rendersAt: number = 8; // => the slow chart appears at tick 8
  const missed: number = pollUntil(rendersAt, 5); // => default budget: 5 ticks
  console.log("default budget: " + String(missed)); // => Output: default budget: -1
  const found: number = pollUntil(rendersAt, 10); // => real: { timeout: 10_000 } on this assertion only
  console.log("custom budget lands at tick: " + String(found)); // => Output: custom budget lands at tick: 8
  console.log("slow render needs budget: " + String(missed === -1 && found === 8)); // => Output: slow render needs budget: true
  console.log("global still 5: " + String(pollUntil(3, 5) === 3)); // => Output: global still 5: true
} // => main ends; one slow assertion got patience, the rest kept the default

function pollUntil(appearsAt: number, timeout: number): number {
  // => stand-in for a timed expect
  for (let tick = 0; tick <= timeout; tick++) {
    // => poll once per tick
    if (tick >= appearsAt) {
      // => the element is visible from its tick on
      return tick; // => pass at the first visible tick
    } // => not yet visible
  } // => budget exhausted
  return -1; // => real Playwright throws expect.toBeVisible timed out
} // => pollUntil returns the landing tick or -1

await main(); // => run once; a failure throws and exits nonzero
