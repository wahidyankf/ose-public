// Example 65: Read the Failure Snapshot. (co-06: trace-viewer)
// => Playwright 1.60.0, docs accessed 2026-10-20; the error ships with a
// => DOM snapshot from the failing moment, so the test failure names the
// => actual text on screen ("$41.00") instead of only the wanted text; read
// => the snapshot before re-running:
// =>   real: expect(locator).toHaveText("$42.00") // error shows received "$41.00" plus the snapshot
async function main(): Promise<void> {
  // => entry point for the snapshot check
  const snapshot = "<h1>Total</h1><p>$41.00</p>"; // => the DOM at the failing moment
  const wanted = "$42.00"; // => what the test wanted
  console.log("wanted: " + wanted); // => Output: wanted: $42.00
  console.log("screen showed: " + extractTotal(snapshot)); // => Output: screen showed: $41.00
  console.log("stale data, not missing page: " + String(extractTotal(snapshot) !== "")); // => Output: stale data, not missing page: true
  console.log("read first, rerun later: " + String(wanted !== extractTotal(snapshot))); // => Output: read first, rerun later: true
} // => main ends; the snapshot explained the failure

function extractTotal(snapshot: string): string {
  // => stand-in for reading the error's snapshot
  const found = snapshot.match(/<p>(.*?)<\/p>/); // => the total paragraph
  return found !== null && found[1] !== undefined ? found[1] : ""; // => the shown total
} // => extractTotal reads what was really there

await main(); // => run once; a failure throws and exits nonzero
