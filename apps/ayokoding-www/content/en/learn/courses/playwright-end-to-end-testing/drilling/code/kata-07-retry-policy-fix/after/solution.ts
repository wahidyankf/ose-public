// Kata 7 solution: retry only the flaky coupon step (bounded), and when it
// keeps failing, name the backend cause instead of burning whole runs.
// (co-10: retry-policy, co-15: flakiness-diagnosis)
async function main(): Promise<void> {
  // => entry point
  let attempts = 0; // => step attempts, bounded
  let cause = ""; // => the named cause when the step keeps failing
  for (let i = 0; i < 2; i++) {
    // => at most two tries of the guilty step
    attempts += 1; // => count this attempt
    cause = "coupon service hiccup"; // => the step reports its cause
  } // => budget spent on the step, not the suite
  console.log("step attempts: " + String(attempts)); // => Output: step attempts: 2
  console.log("cause named: " + cause); // => Output: cause named: coupon service hiccup
  console.log("whole runs burned: 0"); // => Output: whole runs burned: 0
  console.log("bounded and named: " + String(attempts === 2 && cause !== "")); // => Output: bounded and named: true
} // => small retry, named cause, no wasted runs

await main(); // => run once
