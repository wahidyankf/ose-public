// Example 20: beforeEach Hooks Seed State. (co-03: fixture)
// => Playwright 1.60.0, docs accessed 2026-10-20; beforeEach runs before
// => every test in its scope, so each test starts from the same seeded cart
// => instead of depending on whatever the previous test left behind:
// =>   real: test.beforeEach(async ({ page }) => { await page.goto("/cart"); });
interface Cart {
  // => the seeded shop state
  items: string[]; // => the items currently in the cart
} // => Cart is reset before every test

async function main(): Promise<void> {
  // => entry point for the hook check
  const seen: string[][] = []; // => what each test saw at its start
  await runSuite(async (cart) => {
    // => two tests sharing one beforeEach
    seen.push([...cart.items]); // => record the starting cart
    cart.items.push("milk"); // => the test mutates the cart
  }, 2); // => run two tests
  console.log("first saw: " + show(seen[0])); // => Output: first saw: (empty)
  console.log("second saw: " + show(seen[1])); // => Output: second saw: (empty)
  console.log("no leakage: " + String((seen[1] as string[]).length === 0)); // => Output: no leakage: true
  console.log("each test reseeded: " + String(seen.length === 2)); // => Output: each test reseeded: true
} // => main ends; both tests started empty

function show(items: string[] | undefined): string {
  // => render one recorded cart
  if (items === undefined || items.length === 0) {
    // => nothing recorded or nothing in it
    return "(empty)"; // => the test started from a clean cart
  } // => non-empty branch below
  return items.join(","); // => list what the test saw
} // => show avoids trailing whitespace in the transcript

async function beforeEach(cart: Cart): Promise<void> {
  // => the hook: reseed before every test
  cart.items = []; // => empty the cart, whatever the last test did
} // => beforeEach restores the starting state

async function runSuite(body: (cart: Cart) => Promise<void>, count: number): Promise<void> {
  // => stand-in for two tests
  const cart: Cart = { items: ["stale"] }; // => deliberately dirty starting state
  for (let i = 0; i < count; i++) {
    // => one iteration per test
    await beforeEach(cart); // => the hook runs before each test
    await body(cart); // => the test runs on seeded state
  } // => every test executed
} // => runSuite replays the suite with hooks

await main(); // => run once; a failure throws and exits nonzero
