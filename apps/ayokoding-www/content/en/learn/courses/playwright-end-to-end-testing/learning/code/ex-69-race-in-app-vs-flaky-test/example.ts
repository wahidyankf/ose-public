// Example 69: Race in the App Versus Flaky Test. (co-15: flakiness-diagnosis)
// => Playwright 1.60.0, docs accessed 2026-10-20; when two clicks increment
// => the same counter through read-then-write, one update is lost no matter
// => how patient the test is; longer timeouts cannot fix a backend race, and
// => the trace showing two overlapping increments proves the app is guilty:
// =>   real: two await page.click() racing one POST /count endpoint
async function main(): Promise<void> {
  // => entry point for the race check
  const lost: number = raceTwoIncrements(); // => two read-then-write increments overlap
  console.log("final count: " + String(lost)); // => Output: final count: 1
  console.log("one update lost: " + String(lost === 1)); // => Output: one update lost: true
  const serial: number = serialIncrements(); // => the same two increments, serialized
  console.log("serial count: " + String(serial)); // => Output: serial count: 2
  console.log("app race, not test flake: " + String(lost === 1 && serial === 2)); // => Output: app race, not test flake: true
} // => main ends; serialization fixed what patience could not

function raceTwoIncrements(): number {
  // => stand-in for two overlapping clicks
  let count = 0; // => the backend counter
  const firstRead: number = count; // => click one reads 0
  const secondRead: number = count; // => click two reads 0 before click one writes
  count = firstRead + 1; // => click one writes 1
  count = secondRead + 1; // => click two writes 1, overwriting
  return count; // => one increment lost
} // => raceTwoIncrements models read-then-write overlap

function serialIncrements(): number {
  // => stand-in for serialized requests
  let count = 0; // => the backend counter
  count = count + 1; // => first increment commits
  count = count + 1; // => second increment builds on the commit
  return count; // => both kept
} // => serialIncrements models the fixed backend

await main(); // => run once; a failure throws and exits nonzero
