// => Example 57: allSettled tolerates partial failure; the batch still reports.
function task(id: string, ok: boolean): Promise<number> {
  // => fixed async task
  const cause = new Error(`down: ${id}`); // => named failure
  return ok ? Promise.resolve(id.length) : Promise.reject(cause); // => one arm each
} // => end of function task(id: string, ok: boolean): Promise<numb
async function main(): Promise<void> {
  // => WHY wrapper: no top-level await in commonjs
  const jobs = [task("ab", true), task("c", false), task("def", true)]; // => mixed outcomes ahead
  const settled = await Promise.allSettled(jobs); // => every outcome lands
  const values: number[] = []; // => collected successes
  const problems: string[] = []; // => collected failure messages
  for (const s of settled) {
    // => split the mixed outcomes
    if (s.status === "fulfilled") {
      // => success arm
      values.push(s.value); // => keep the value
    } else {
      // => failure arm
      problems.push((s.reason as Error).message); // => keep the message only
    } // => end of else
  } // => end of for (const s of settled)
  console.log("values:", values.join(",")); // => Output: values: 2,3
  console.log("problems:", problems.join(",")); // => Output: problems: down: c
} // => end of async function main(): Promise<void>
void main(); // => floating promise: rejections would fail the run loudly
