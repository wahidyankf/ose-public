// Kata 3 solution: capture the outgoing request in the route handler and
// assert on its payload before answering. Wrong payloads fail the test even
// when the banner would have rendered.
// (co-05: network-interception)
interface Captured {
  // => what the app sent
  url: string; // => the request URL
  item: string; // => the ordered item
  count: number; // => the ordered count
} // => Captured is the contract under test

async function main(): Promise<void> {
  // => entry point
  const seen: Captured[] = []; // => every intercepted request lands here
  orderThroughRoute(seen, "milk", 2); // => the app orders correctly
  console.log("item: " + String(seen[0]?.item)); // => Output: item: milk
  console.log("count: " + String(seen[0]?.count)); // => Output: count: 2
  orderThroughRoute(seen, "bread", 2); // => the app orders the wrong item
  const last: number = seen.length - 1; // => the newest capture
  console.log("wrong payload caught: " + String(seen[last]?.item !== "milk")); // => Output: wrong payload caught: true
  console.log("payload asserted: " + String(seen[0]?.item === "milk" && seen[0]?.count === 2)); // => Output: payload asserted: true
} // => the payload, not the pixels, decides

function orderThroughRoute(seen: Captured[], item: string, count: number): void {
  // => stand-in for route + assertions
  seen.push({ url: "/api/order", item: item, count: count }); // => the handler inspects the request here
} // => orderThroughRoute records what the app sent

await main(); // => run once
