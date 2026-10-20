// Example 29: Mock an Error Response. (co-05: network-interception)
// => Playwright 1.60.0, docs accessed 2026-10-20; fulfilling with a 500
// => exercises the app's error path on demand -- no staging outage needed.
// => The test then asserts the banner the user would see, not the status:
// =>   real: await page.route("**/api/cart", (route) => route.fulfill({ status: 500, body: "boom" }));
interface Page {
  // => the modeled cart page
  banner: string; // => the error banner text, "" when none
  total: string; // => the cart total, "?" until data arrives
} // => Page shows either data or the error path

async function main(): Promise<void> {
  // => entry point for the error-path check
  const page: Page = { banner: "", total: "?" }; // => cart starts loading
  loadCart(page, 500); // => the backend fails once, on purpose
  console.log("banner: " + page.banner); // => Output: banner: Cart unavailable, try again
  console.log("total hidden: " + String(page.total === "?")); // => Output: total hidden: true
  const retry: Page = { banner: "", total: "?" }; // => a fresh page for the happy path
  loadCart(retry, 200); // => the backend recovers
  console.log("recovered total: " + retry.total); // => Output: recovered total: $42.00
  console.log("error path covered: " + String(page.banner !== "" && retry.total === "$42.00")); // => Output: error path covered: true
} // => main ends; both paths rendered

function loadCart(page: Page, status: number): void {
  // => stand-in for route.fulfill with a status
  if (status !== 200) {
    // => the backend is down in this scenario
    page.banner = "Cart unavailable, try again"; // => the app shows its error banner
    return; // => no total to render
  } // => happy path below
  page.total = "$42.00"; // => the app renders the settled total
} // => loadCart renders data or the error banner

await main(); // => run once; a failure throws and exits nonzero
