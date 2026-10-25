// => Example 15: AggregateError reports every failure; allSettled keeps mixed outcomes.
async function maybe(id: string, ok: boolean): Promise<string> {
  // => deterministic stand-in task
  if (!ok) {
    // => the failing branch throws
    throw new Error(`task ${id} failed`); // => names the failed task
  } // => end of if (!ok)
  return `task ${id} ok`; // => success value
} // => end of async function maybe(id: string, ok: boolean): Promi
async function main(): Promise<void> {
  // => WHY wrapper: no top-level await in commonjs
  const tasks = [maybe("a", true), maybe("b", false), maybe("c", true)]; // => mixed outcomes ahead
  const results = await Promise.allSettled(tasks); // => WHY allSettled: every outcome lands
  for (const r of results) {
    // => walk the mixed outcomes in order
    if (r.status === "fulfilled") {
      // => narrow to the success arm
      console.log("ok:", r.value); // => Output: ok: task a ok, then task c ok
    } else {
      // => the rejection arm, reason known present
      console.log("bad:", (r.reason as Error).message); // => Output: bad: task b failed
    } // => end of else
  } // => end of for (const r of results)
  const failures = results.filter((r) => r.status === "rejected"); // => gather only failures
  if (failures.length > 0) {
    // => report them as one error
    const causes = failures.map((f) => (f as PromiseRejectedResult).reason); // => keep every cause
    const err = new AggregateError(causes, "batch failed"); // => WHY AggregateError: one summary
    console.log(err.message, "with", err.errors.length, "causes"); // => Output: batch failed with 1 causes
  } // => end of if (failures.length > 0)
} // => end of async function main(): Promise<void>
void main(); // => floating promise: rejections would fail the run loudly
