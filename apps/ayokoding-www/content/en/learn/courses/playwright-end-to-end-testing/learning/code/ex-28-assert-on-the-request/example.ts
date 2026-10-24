// Example 28: Assert on the Request. (co-05: network-interception)
// => Playwright 1.60.0, docs accessed 2026-10-20; the route handler sees
// => the outgoing request before answering it, so the test asserts on the
// => method, URL, and body the app sent -- not just the pixels it rendered:
// =>   real: await page.route("**/api/order", async (route) => { captured = route.request().postDataJSON(); ... });
interface Captured {
  // => what the app sent
  method: string; // => GET, POST, and friends
  url: string; // => the request URL
  body: string; // => the raw request body
} // => Captured is the test's view of the outgoing call

async function main(): Promise<void> {
  // => entry point for the request check
  const captured: Captured[] = []; // => every intercepted request lands here
  const reply: string = postThroughRoute(captured, "/api/order", { item: "milk", count: 2 }); // => the app orders milk
  console.log("method: " + String(captured[0]?.method)); // => Output: method: POST
  console.log("url: " + String(captured[0]?.url)); // => Output: url: /api/order
  console.log("item: " + String(JSON.parse(String(captured[0]?.body))["item"])); // => Output: item: milk
  console.log("reply: " + reply); // => Output: reply: order-7
  console.log("payload correct: " + String(JSON.parse(String(captured[0]?.body))["count"] === 2)); // => Output: payload correct: true
} // => main ends; the request was correct, not just the pixels

function postThroughRoute(captured: Captured[], url: string, payload: Record<string, unknown>): string {
  // => stand-in for route + continue
  const body: string = JSON.stringify(payload); // => the app serializes the order
  captured.push({ method: "POST", url: url, body: body }); // => the route handler inspects it here
  return "order-7"; // => the mock confirms the order
} // => postThroughRoute records then answers

await main(); // => run once; a failure throws and exits nonzero
