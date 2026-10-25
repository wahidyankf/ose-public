// Kata 03 starter: an action that trusts the client and breaks on bad input.
// => NusaMart is fictional; every product here is fixed.
// => TODO: validate id and qty, return named field errors, and mutate only
// => when every rule passes. See Examples 29 and 33.
const STOCK: Record<string, number> = { "kopi-001": 2 }; // => fictional stock
function buy(id: string, qty: number): string {
  // => trusting action: mutates first, asks never
  STOCK[id] -= qty; // => corrupts unknown ids to NaN, oversells stock
  return "bought " + qty + " x " + id; // => always claims success
} // => end of buy
console.log(buy("kopi-001", 1)); // => Output bought 1 x kopi-001
console.log(buy("susu-009", 3)); // => Output success for a ghost product: fix this
export {}; // => module scope keeps these names local
