// Example 24: Fixture That Cleans Up. (co-03: fixture)
// => Playwright 1.60.0, docs accessed 2026-10-20; a fixture that creates an
// => order, a user, or a temp file must delete it in teardown, or one
// => suite run pollutes the next; the create-then-remove pair lives in the
// => same fixture so no test can forget half of it:
// =>   real: const order = await createOrder(); await use(order); await deleteOrder(order.id);
async function main(): Promise<void> {
  // => entry point for the cleanup check
  const store: Map<string, string> = new Map(); // => the backend the fixture manages
  const id: string = createOrder(store); // => setup: the test gets a real order
  console.log("created: " + id); // => Output: created: order-1
  console.log("exists during test: " + String(store.has(id))); // => Output: exists during test: true
  deleteOrder(store, id); // => teardown: the fixture removes what it made
  console.log("gone after teardown: " + String(!store.has(id))); // => Output: gone after teardown: true
  console.log("store empty: " + String(store.size === 0)); // => Output: store empty: true
} // => main ends; nothing created survives the fixture

function createOrder(store: Map<string, string>): string {
  // => the setup half
  const id = "order-" + String(store.size + 1); // => deterministic id from the count
  store.set(id, "pending"); // => the order exists now
  return id; // => hand the id to the test
} // => createOrder returns what it registered

function deleteOrder(store: Map<string, string>, id: string): void {
  // => the teardown half
  store.delete(id); // => remove exactly what setup created
} // => deleteOrder leaves no residue

await main(); // => run once; a failure throws and exits nonzero
