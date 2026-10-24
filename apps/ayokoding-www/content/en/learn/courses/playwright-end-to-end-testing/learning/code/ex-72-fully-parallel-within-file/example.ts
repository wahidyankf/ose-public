// Example 72: Fully Parallel Within a File. (co-11: parallel-sharding)
// => Playwright 1.60.0, docs accessed 2026-10-20; test.describe.configure
// => ({ mode: "parallel" }) runs a file's tests side by side in separate
// => workers; parallel tests must be independent (fresh fixtures, unique
// => data), which Examples 17 and 44 already set up:
// =>   real: test.describe.configure({ mode: "parallel" }); test("one", ...); test("two", ...);
async function main(): Promise<void> {
  // => entry point for the parallel check
  const ran: string[] = await runParallel(["one", "two", "three"]); // => three independent tests at once
  console.log("ran: " + ran.join(",")); // => Output: ran: one,two,three
  console.log("all three ran: " + String(ran.length === 3)); // => Output: all three ran: true
  const serial: string[] = await runSerial(["one", "two"]); // => the serial file for contrast
  console.log("serial ran: " + serial.join(",")); // => Output: serial ran: one,two
  console.log("mode is a choice: " + String(ran.length === 3 && serial.length === 2)); // => Output: mode is a choice: true
} // => main ends; parallel ran together, serial ran in order

async function runParallel(tests: string[]): Promise<string[]> {
  // => stand-in for mode: parallel
  return Promise.all(tests.map(async (test) => test)).then((done) => done); // => every test runs at once
} // => runParallel resolves when all finish

async function runSerial(tests: string[]): Promise<string[]> {
  // => stand-in for the default serial mode
  const done: string[] = []; // => finished tests in order
  for (const test of tests) {
    // => one at a time
    done.push(await Promise.resolve(test)); // => await each before the next
  } // => every test finished
  return done; // => in file order
} // => runSerial preserves the file order

await main(); // => run once; a failure throws and exits nonzero
