// Kata 7 starter: the test retries the WHOLE suite run five times around a
// backend bug that fails every time. Five runs, still red, and the retry log
// says nothing about the cause.
// Task: bound the retry to the flaky step and surface the real cause (see
// Examples 42 and 67). Retries must stay small and the cause must be named.
async function main(): Promise<void> {
  let runs = 0; // whole-test retries around a permanent bug
  for (let i = 0; i < 5; i++) {
    // five full runs
    runs += 1; // each run fails the same way
  } // budget burned, nothing learned
  console.log("runs burned: " + String(runs));
  console.log("cause named: false");
  console.log("wasteful: " + String(runs === 5));
}

await main();
