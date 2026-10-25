// => Worked Example 20: a test layer swaps the database without touching logic.
// => co-05: in Effect this is Layer.succeed(TestDb): production and test provide differently.
// => co-16: the swap is the test: same assertions, different layer.
interface UserDb {
  // => the database contract: the only database operation the logic needs
  findName(id: string): string | null; // => null means absent, like a real lookup
}
function displayName(db: UserDb, id: string): string {
  // => the logic under test: depends on the contract, never on a concrete database
  const found: string | null = db.findName(id); // => read through the injected contract
  if (found === null) {
    // => absent users get the fallback label
    return "unknown (" + id + ")"; // => fallback names the missing id
  } // => present: fall through
  return found; // => the stored name
}
function main(): void {
  // => entry point; production map versus test map, same function
  // => the production layer: a two-row map standing in for the real database
  const prodDb: UserDb = { findName: (id: string) => (id === "u1" ? "Ada" : null) }; // => production data
  console.log("prod: " + displayName(prodDb, "u1")); // => Output: prod: Ada
  // => the test layer: an empty map that forces the fallback branch
  const testDb: UserDb = { findName: (_id: string) => null }; // => test double: always absent
  console.log("test: " + displayName(testDb, "u1")); // => Output: test: unknown (u1)
  // => the same assertion style a real suite uses: both layers behave as specified
  const prodHit: boolean = displayName(prodDb, "u1") === "Ada"; // => production branch check
  const testMiss: boolean = displayName(testDb, "u1") === "unknown (u1)"; // => fallback branch check
  console.log("layers: prod=" + String(prodHit) + " test=" + String(testMiss)); // => Output: layers: prod=true test=true
}
main(); // => run once; a throw exits nonzero
