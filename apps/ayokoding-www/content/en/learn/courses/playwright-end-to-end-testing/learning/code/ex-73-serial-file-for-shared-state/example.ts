// Example 73: Serial File for Shared State. (co-11: parallel-sharding)
// => Playwright 1.60.0, docs accessed 2026-10-20; test.describe.configure
// => ({ mode: "serial" }) runs a file's tests strictly in order and stops at
// => the first failure; serial mode is for tests sharing one login or one
// => resource where reordering would break the setup:
// =>   real: test.describe.configure({ mode: "serial" }); // order matters inside
async function main(): Promise<void> {
  // => entry point for the serial check
  const log: string[] = []; // => the execution order record
  await runSerialFile(log, ["seed coupon", "spend coupon", "verify empty"], null); // => three dependent steps
  console.log("order: " + log.join(" > ")); // => Output: order: seed coupon > spend coupon > verify empty
  console.log("in file order: " + String(log[0] === "seed coupon" && log[2] === "verify empty")); // => Output: in file order: true
  const stopped: string[] = []; // => a second file with a failure in the middle
  await runSerialFile(stopped, ["seed coupon", "boom", "never runs"], "boom"); // => boom throws
  console.log("stopped after failure: " + String(stopped.join(",") === "seed coupon,boom")); // => Output: stopped after failure: true
  console.log("serial protects setup: " + String(log.length === 3)); // => Output: serial protects setup: true
} // => main ends; order preserved, failure stops the file

async function runSerialFile(log: string[], tests: string[], failAt: string | null): Promise<void> {
  // => stand-in for mode: serial
  for (const test of tests) {
    // => strictly in file order
    log.push(test); // => record the step
    if (test === failAt) {
      // => this step failed
      return; // => stop the file: later tests are skipped
    } // => passing steps continue
  } // => every allowed step ran
} // => runSerialFile stops the file at the first failure

await main(); // => run once; a failure throws and exits nonzero
