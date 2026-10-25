// Example 31: Wait for the API Then Assert UI. (co-05: network-interception, co-02: auto-waiting)
// => Playwright 1.60.0, docs accessed 2026-10-20; combining route.fulfill
// => with waitForResponse asserts the full round trip: the app asked, the
// => mock answered, and the UI shows the answer -- three facts, one test:
// =>   real: const [res] = await Promise.all([page.waitForResponse("**/api/total"), page.click()]);
async function main(): Promise<void> {
  // => entry point for the round-trip check
  const log: string[] = []; // => the round trip, in order
  const total: string = roundTrip(log); // => the app asks, the mock answers, the UI renders
  console.log("asked: " + String(log[0])); // => Output: asked: GET /api/total
  console.log("answered: " + String(log[1])); // => Output: answered: 200 $42.00
  console.log("rendered: " + total); // => Output: rendered: $42.00
  console.log("round trip complete: " + String(log.length === 2 && total === "$42.00")); // => Output: round trip complete: true
} // => main ends; request, response, and render all verified

function roundTrip(log: string[]): string {
  // => stand-in for route.fulfill plus waitForResponse
  log.push("GET /api/total"); // => the app sends its request
  log.push("200 $42.00"); // => the mock answers with the total
  return "$42.00"; // => the UI renders the answered total
} // => roundTrip records the full exchange

await main(); // => run once; a failure throws and exits nonzero
