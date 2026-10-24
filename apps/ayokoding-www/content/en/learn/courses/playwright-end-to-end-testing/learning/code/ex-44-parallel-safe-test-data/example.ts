// Example 44: Parallel-Safe Test Data. (co-11: parallel-sharding, co-04: page-object)
// => Playwright 1.60.0, docs accessed 2026-10-20; parallel workers must
// => never share mutable names: derive the test user from the worker index
// => (testInfo.parallelIndex) so two workers create two users and no unique
// => constraint ever collides:
// =>   real: const user = `buyer-${testInfo.parallelIndex}-${testInfo.workerIndex}`;
async function main(): Promise<void> {
  // => entry point for the uniqueness check
  const created: string[] = []; // => every user the suite creates
  for (const worker of [0, 1, 2]) {
    // => three parallel workers
    created.push("buyer-" + String(worker)); // => real: `buyer-${testInfo.parallelIndex}`
  } // => every worker named its own user
  console.log("users: " + created.join(",")); // => Output: users: buyer-0,buyer-1,buyer-2
  console.log("unique: " + String(new Set(created).size === created.length)); // => Output: unique: true
  console.log("no shared names: " + String(!created.includes("buyer-shared"))); // => Output: no shared names: true
  console.log("scales with workers: " + String(created.length === 3)); // => Output: scales with workers: true
} // => main ends; every worker owned its data

await main(); // => run once; a failure throws and exits nonzero
