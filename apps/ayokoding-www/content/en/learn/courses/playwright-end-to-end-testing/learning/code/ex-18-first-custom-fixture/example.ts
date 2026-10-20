// Example 18: First Custom Fixture. (co-03: fixture)
// => Playwright 1.60.0, docs accessed 2026-10-20; test.extend creates a
// => named fixture: setup builds the value, the test receives it as an
// => argument, teardown runs after. Fixtures replace copy-pasted setup:
// =>   real: const test = base.extend({ page: async ({}, use) => { ... } });
interface FixturePage {
  // => what the fixture hands each test
  user: string | null; // => nobody logged in yet
  greeting: string; // => what the header shows
} // => FixturePage is the shared starting state

async function main(): Promise<void> {
  // => entry point for the fixture check
  await runTest("guest sees guest greeting", async (page) => {
    // => real: test("...", async ({ page }) => { ... })
    console.log("user: " + String(page.user)); // => Output: user: null
    console.log("greeting: " + page.greeting); // => Output: greeting: Welcome, guest
    console.log("fixture built the page: " + String(page.greeting.includes("guest"))); // => Output: fixture built the page: true
  }); // => teardown runs after the callback returns
} // => main ends; one test, one fixture lifecycle

async function loggedOutPage(): Promise<FixturePage> {
  // => the fixture setup function
  return { user: null, greeting: "Welcome, guest" }; // => build the logged-out page
} // => setup ends; the value is ready to hand over

async function teardown(_page: FixturePage): Promise<void> {
  // => the fixture teardown function
  return undefined; // => nothing to close for an in-memory page
} // => teardown ends; a real browser context would close here

async function runTest(_name: string, body: (page: FixturePage) => Promise<void>): Promise<void> {
  // => stand-in for test()
  const page: FixturePage = await loggedOutPage(); // => setup runs before the test
  await body(page); // => the test receives the fixture value
  await teardown(page); // => teardown runs after the test
} // => runTest wraps one test in the fixture lifecycle

await main(); // => run once; a failure throws and exits nonzero
