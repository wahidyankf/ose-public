// Example 26: First Route Interception. (co-05: network-interception)
// => Playwright 1.60.0, docs accessed 2026-10-20; page.route matches a URL
// => pattern and fulfills it with canned bytes, so the test runs with no
// => backend at all; the UI renders from the mock exactly as from real data:
// =>   real: await page.route("**/api/products", async (route) => route.fulfill({ json: [...] }));
interface Mock {
  // => one canned reply
  status: number; // => the HTTP status to report
  body: string; // => the bytes the UI receives
} // => Mock is the whole backend for one URL

interface Seen {
  // => what the app asked for
  url: string; // => the requested URL
  served: string; // => the mock body it received
} // => Seen proves the app really called the mock

async function main(): Promise<void> {
  // => entry point for the route check
  const routes = new Map<string, Mock>(); // => the route table, empty at first
  routes.set("/api/products", { status: 200, body: '["milk","bread"]' }); // => real: page.route("**/api/products", ...)
  const seen: Seen[] = []; // => every request the app makes lands here
  const body: string = request(routes, seen, "/api/products"); // => the UI fetches the list
  const products = JSON.parse(body) as string[]; // => the UI parses what it got
  console.log("products: " + products.join(",")); // => Output: products: milk,bread
  console.log("requests seen: " + String(seen.length)); // => Output: requests seen: 1
  console.log("mock served: " + String(seen[0]?.served === body)); // => Output: mock served: true
  console.log("no backend needed: " + String(seen.length === 1 && products.length === 2)); // => Output: no backend needed: true
} // => main ends; the UI rendered from canned bytes

function request(routes: Map<string, Mock>, seen: Seen[], url: string): string {
  // => stand-in for fetch through page.route
  const mock: Mock | undefined = routes.get(url); // => first matching route wins
  if (mock === undefined) {
    // => no route matches: the call would hit the network
    throw new Error("unrouted request: " + url); // => fail loudly, never silently use live data
  } // => routed branch below
  seen.push({ url: url, served: mock.body }); // => record the interception
  return mock.body; // => serve the canned bytes
} // => request fulfills from the route table

await main(); // => run once; a failure throws and exits nonzero
