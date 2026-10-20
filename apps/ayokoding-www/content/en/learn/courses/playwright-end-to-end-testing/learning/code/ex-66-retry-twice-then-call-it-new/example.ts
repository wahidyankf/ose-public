// Example 66: Retry Twice Then Call It New. (co-10: retry-policy)
// => Playwright 1.60.0, docs accessed 2026-10-20; retries: 2 absorbs
// => infrastructure hiccups (a slow container, a dropped packet) while a
// => test failing three times in a row is genuinely broken; the retry budget
// => is small and the same for every test:
// =>   real: // playwright.config.ts: { retries: 2 } (CI only; zero locally)
async function main(): Promise<void> {
  // => entry point for the retry-budget check
  const flaky: number[] = [0]; // => fails twice, then passes
  const result: string = runWithRetries(flaky, 2, 2); // => two failures allowed, passes on third run
  console.log("runs: " + String(flaky[0])); // => Output: runs: 3
  console.log("result: " + result); // => Output: result: pass
  const broken: number[] = [0]; // => never passes
  const verdict: string = runWithRetries(broken, 9, 2); // => fails every run
  console.log("broken runs: " + String(broken[0])); // => Output: broken runs: 3
  console.log("verdict: " + verdict); // => Output: verdict: fail
  console.log("budget bounds everything: " + String(flaky[0] === 3 && broken[0] === 3)); // => Output: budget bounds everything: true
} // => main ends; retries absorbed the hiccup, convicted the bug

function runWithRetries(counter: number[], failFirst: number, retries: number): string {
  // => stand-in for retries: N
  const budget: number = 1 + retries; // => the first run plus the retries
  for (let run = 0; run < budget; run++) {
    // => at most budget runs
    counter[0] = (counter[0] as number) + 1; // => count this run
    if ((counter[0] as number) > failFirst) {
      // => the app recovered by this run
      return "pass"; // => green within budget
    } // => still failing
  } // => budget exhausted
  return "fail"; // => genuinely broken: three reds in a row
} // => runWithRetries caps the patience at the budget

await main(); // => run once; a failure throws and exits nonzero
