// Example 67: Quarantine Is Not a Fix. (co-10: retry-policy, co-15: flakiness-diagnosis)
// => Playwright 1.60.0, docs accessed 2026-10-20; marking a test flaky or
// => quarantining it hides the red without removing the cause; the bug below
// => passes in isolation (fresh backend) and fails in the suite (shared
// => backend), which proves the test is innocent and the app is guilty:
// =>   real: run the file alone (green) then the suite (red) -- order dependence, not flakiness
async function main(): Promise<void> {
  // => entry point for the quarantine check
  const alone: boolean = runAlone(); // => fresh backend: green
  const inSuite: boolean = runInSuite(); // => shared backend: red
  console.log("alone: " + String(alone)); // => Output: alone: true
  console.log("in suite: " + String(inSuite)); // => Output: in suite: false
  console.log("quarantine hides it: " + String(alone && !inSuite)); // => Output: quarantine hides it: true
  console.log("fix the backend: " + String(!inSuite)); // => Output: fix the backend: true
} // => main ends; the suite order convicted the backend

function runAlone(): boolean {
  // => stand-in for running the file alone
  return true; // => fresh backend, no contention
} // => runAlone passes

function runInSuite(): boolean {
  // => stand-in for running after the order test
  const taken = true; // => the earlier test took the only coupon
  return !taken; // => nothing left: red, deterministically
} // => runInSuite fails on shared state

await main(); // => run once; a failure throws and exits nonzero
