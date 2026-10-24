// => Example 59: AbortController cancels cooperative work; the checks stay synchronous.
async function run(signal: AbortSignal): Promise<string> {
  // => cooperative worker
  const done: string[] = []; // => completed steps
  for (const s of ["one", "two", "three"]) {
    // => fixed step list
    if (signal.aborted) {
      // => WHY check: cooperative cancellation point
      return "aborted"; // => early exit with a fixed label
    } // => end of if (signal.aborted)
    done.push(s); // => step completed
  } // => end of for (const s of ["one", "two", "three"])
  return `finished: ${done.length} steps`; // => fixed completion label
} // => end of async function run(signal: AbortSignal): Promise<str
async function main(): Promise<void> {
  // => WHY wrapper: no top-level await in commonjs
  const dead = new AbortController(); // => the cancelled handle
  dead.abort(); // => abort before the work starts: deterministic
  console.log(await run(dead.signal)); // => Output: aborted
  const live = new AbortController(); // => a live signal for the success path
  console.log(await run(live.signal)); // => Output: finished: 3 steps
} // => end of async function main(): Promise<void>
void main(); // => floating promise: rejections would fail the run loudly
