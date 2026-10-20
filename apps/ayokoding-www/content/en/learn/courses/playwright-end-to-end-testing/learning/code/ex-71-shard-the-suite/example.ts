// Example 71: Shard the Suite Across Workers. (co-11: parallel-sharding)
// => Playwright 1.60.0, docs accessed 2026-10-20; --shard=1/2 and --shard=2/2
// => split the suite deterministically across CI machines; each shard runs
// => its slice with no overlap and no shared state, so wall time divides by
// => the shard count:
// =>   real: npx playwright test --shard=1/2 (machine one) and --shard=2/2 (machine two)
async function main(): Promise<void> {
  // => entry point for the sharding check
  const suite: string[] = ["login", "search", "cart", "checkout", "orders", "profile", "admin", "logout"]; // => eight tests
  const first: string[] = shard(suite, 1, 2); // => real: --shard=1/2
  const second: string[] = shard(suite, 2, 2); // => real: --shard=2/2
  console.log("shard one: " + first.join(",")); // => Output: shard one: login,cart,orders,admin
  console.log("shard two: " + second.join(",")); // => Output: shard two: search,checkout,profile,logout
  console.log("no overlap: " + String(first.every((test) => !second.includes(test)))); // => Output: no overlap: true
  console.log("full coverage: " + String(first.length + second.length === suite.length)); // => Output: full coverage: true
} // => main ends; two machines split eight tests evenly

function shard(suite: string[], index: number, total: number): string[] {
  // => stand-in for --shard=i/n
  return suite.filter((_, i) => i % total === index - 1); // => round-robin slice, deterministic
} // => shard assigns every test to exactly one slice

await main(); // => run once; a failure throws and exits nonzero
