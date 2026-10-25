// Example 32: Modify a Live Response. (co-05: network-interception)
// => Playwright 1.60.0, docs accessed 2026-10-20; route.fetchResponse plus
// => fulfill lets the test pass the real reply through with one field
// => changed -- a discount applied, a flag flipped -- exercising UI branches
// => a static mock would need a second file for:
// =>   real: const res = await route.fetch(); await route.fulfill({ response: res, json: { ...await res.json(), sale: true } });
async function main(): Promise<void> {
  // => entry point for the modification check
  const live: Record<string, unknown> = { item: "milk", price: 3.0, sale: false }; // => what the backend really says
  const shown: Record<string, unknown> = modify(live, { sale: true, price: 2.4 }); // => real: fulfill with the tweaked json
  console.log("item: " + String(shown["item"])); // => Output: item: milk
  console.log("sale badge: " + String(shown["sale"])); // => Output: sale badge: true
  console.log("sale price: " + String(shown["price"])); // => Output: sale price: 2.4
  console.log("untouched keys kept: " + String(shown["item"] === "milk")); // => Output: untouched keys kept: true
} // => main ends; one field changed, the rest passed through

function modify(live: Record<string, unknown>, patch: Record<string, unknown>): Record<string, unknown> {
  // => stand-in for fetch plus fulfill
  return { ...live, ...patch }; // => the real reply with the patch applied on top
} // => modify keeps every key the patch does not name

await main(); // => run once; a failure throws and exits nonzero
