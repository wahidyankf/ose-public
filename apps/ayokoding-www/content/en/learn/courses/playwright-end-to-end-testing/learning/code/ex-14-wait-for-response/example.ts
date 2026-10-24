// Example 14: Waiting for Response. (co-05: network-interception, co-02: auto-waiting)
// => Playwright 1.60.0, docs accessed 2026-10-20; waitForResponse pauses
// => the test until the app's own request finishes, so the UI assertion runs
// => against settled data instead of a loading spinner:
// =>   real: await page.waitForResponse((r) => r.url().includes("/api/cart"));
interface Reply {
  // => one modeled network reply
  url: string; // => the request URL
  status: number; // => the response status
  readyAtTick: number; // => the tick the response arrives
} // => Reply says what arrives and when

async function main(): Promise<void> {
  // => entry point for the response wait
  const cart: Reply = { url: "/api/cart", status: 200, readyAtTick: 2 }; // => the cart call lands at tick 2
  const seen: Reply = waitForResponse(cart, 5); // => real: await page.waitForResponse("**/api/cart")
  console.log("response url: " + seen.url); // => Output: response url: /api/cart
  console.log("status: " + String(seen.status)); // => Output: status: 200
  console.log("waited ticks: " + String(seen.readyAtTick)); // => Output: waited ticks: 2
  console.log("settled before assert: " + String(seen.readyAtTick <= 5)); // => Output: settled before assert: true
} // => main ends; the UI may now assert against real data

function waitForResponse(reply: Reply, timeout: number): Reply {
  // => stand-in for page.waitForResponse
  for (let tick = 0; tick <= timeout; tick++) {
    // => poll once per tick
    if (tick >= reply.readyAtTick) {
      // => the response has arrived
      return reply; // => resolve with the finished response
    } // => still in flight
  } // => timeout exhausted
  throw new Error("waitForResponse timed out for " + reply.url); // => real Playwright names the unmatched URL
} // => waitForResponse resolves when the call finishes

await main(); // => run once; a failure throws and exits nonzero
