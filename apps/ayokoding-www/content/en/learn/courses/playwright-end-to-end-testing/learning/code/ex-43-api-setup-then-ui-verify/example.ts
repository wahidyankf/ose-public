// Example 43: API Setup Then UI Verify. (co-14: api-testing, co-04: page-object)
// => Playwright 1.60.0, docs accessed 2026-10-20; create the test's
// => preconditions through the API (fast, no clicking through setup
// => screens), then verify the one thing only the UI can show. Setup flies,
// => assertion stays honest:
// =>   real: const order = await api.post("/api/orders", {...}); await page.goto(`/orders/${order.id}`);
interface Order {
  // => the order created through the API
  id: string; // => the order id the UI will show
  item: string; // => what was ordered
} // => Order crosses the API/UI boundary

async function main(): Promise<void> {
  // => entry point for the mixed check
  const backend: Order[] = []; // => the backend the API writes to
  const created: Order = apiCreateOrder(backend, "milk"); // => real: await api.post("/api/orders", { item: "milk" })
  console.log("created: " + created.id); // => Output: created: order-1
  const shown: string = uiOrderRow(backend, created.id); // => real: await page.goto("/orders"); row text
  console.log("ui shows: " + shown); // => Output: ui shows: milk
  console.log("api setup, ui proof: " + String(shown === "milk" && backend.length === 1)); // => Output: api setup, ui proof: true
} // => main ends; the fast path set up, the real path proved

function apiCreateOrder(backend: Order[], item: string): Order {
  // => stand-in for api.post
  const order: Order = { id: "order-" + String(backend.length + 1), item: item }; // => deterministic id
  backend.push(order); // => the backend stores it
  return order; // => hand the created order to the test
} // => apiCreateOrder skips every setup screen

function uiOrderRow(backend: Order[], id: string): string {
  // => stand-in for reading the orders page
  const found: Order | undefined = backend.find((order) => order.id === id); // => the row for this order
  return found !== undefined ? found.item : ""; // => what the user would see
} // => uiOrderRow renders from the same backend

await main(); // => run once; a failure throws and exits nonzero
