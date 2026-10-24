// Example 12: Web-First Assertion Retries. (co-02: auto-waiting)
// => Playwright 1.60.0, docs accessed 2026-10-20; web-first assertions like
// => toHaveText retry the whole assertion (locate plus match) until it passes,
// => so a price that renders one tick after the row still matches; a plain
// => assert reads once and flakes:
// =>   real: await expect(page.getByTestId("total")).toHaveText("$42.00");
async function main(): Promise<void> {
  // => entry point for the retry check
  const totalAtTick: string[] = ["", "", "$41.00", "$42.00"]; // => total text per tick: empty, empty, stale, final
  const seen: string = retryToHaveText(totalAtTick, "$42.00", 5); // => real: await expect(total).toHaveText("$42.00")
  console.log("matched: " + seen); // => Output: matched: $42.00
  console.log("matched at tick: " + String(totalAtTick.indexOf(seen))); // => Output: matched at tick: 3
  const once: string = readOnce(totalAtTick); // => a single read sees only the first tick
  console.log("single read sees: '" + once + "'"); // => Output: single read sees: ''
  console.log("retry wins: " + String(seen === "$42.00" && once === "")); // => Output: retry wins: true
} // => main ends; retrying found the final text

function retryToHaveText(frames: string[], wanted: string, timeout: number): string {
  // => stand-in for expect().toHaveText()
  for (let tick = 0; tick <= timeout && tick < frames.length; tick++) {
    // => re-locate and re-match every tick
    if (frames[tick] === wanted) {
      // => the text matches at this tick
      return frames[tick] as string; // => pass with the matched text
    } // => no match yet
  } // => timeout exhausted
  throw new Error("toHaveText timed out waiting for " + wanted); // => real Playwright fails listing every tick seen
} // => retryToHaveText polls the full assertion

function readOnce(frames: string[]): string {
  // => stand-in for a plain one-shot assert
  return frames[0] as string; // => reads tick 0 only, blind to later renders
} // => readOnce models the flaky alternative

await main(); // => run once; a failure throws and exits nonzero
