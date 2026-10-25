// => Example 72: read the policy first: tries, attempts, and the give-up at the bottom.
function flaky(attempt: number): string {
  // => fails twice, then succeeds: fixed script
  if (attempt < 3) {
    // => the failure window
    throw new Error(`boom on ${attempt}`); // => numbered failure
  } // => end of if (attempt < 3)
  return `steady on ${attempt}`; // => success after the window
} // => end of function flaky(attempt: number): string
function withRetry(tries: number): { value: string; attempts: number } {
  // => WHY attempts out: policy visible
  let last = ""; // => last failure message
  for (let attempt = 1; attempt <= tries; attempt++) {
    // => bounded loop: gives up
    try {
      // => each attempt guarded
      return { value: flaky(attempt), attempts: attempt }; // => success exits with the count
    } catch (err) {
      // => record and continue
      last = err instanceof Error ? err.message : String(err); // => message only, no stack
    } // => end of catch (err)
  } // => end of for (let attempt = 1; attempt <= tries; attempt++)
  throw new Error(`all ${tries} tries failed, last: ${last}`); // => give-up names the budget
} // => end of function withRetry(tries: number): { value: string;
const done = withRetry(5); // => budget of five
console.log(done.value, `after ${done.attempts}`); // => Output: steady on 3 after 3
try {
  // => the too-small budget below
  withRetry(2); // => the window needs three
} catch (err) {
  // => report the give-up
  console.log("gave up:", err instanceof Error ? err.message : err); // => Output: gave up, budget named
} // => end of catch (err)
