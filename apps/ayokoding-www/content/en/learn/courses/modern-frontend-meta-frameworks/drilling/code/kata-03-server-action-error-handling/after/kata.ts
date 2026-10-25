// Kata 03 solution: an action that validates, then mutates, then reports.
// => NusaMart is fictional; every product and quantity here is fixed.
// => Every rule is checked before any mutation: unknown ids and bad
// => quantities return named errors, and stock can never go negative.
const STOCK: Record<string, number> = { "kopi-001": 2 }; // => fictional stock
type ActionError = { code: "unknown" | "bad-qty" | "out-of-stock"; detail: string }; // => error shape
function buy(id: string, qty: number): string {
  // => guarded action
  if (STOCK[id] === undefined) {
    // => unknown product
    const err: ActionError = { code: "unknown", detail: id }; // => named error
    return "error [" + err.code + "]: " + err.detail; // => no mutation
  } // => end of the unknown branch
  if (!Number.isInteger(qty) || qty < 1) {
    // => bad quantity
    const err: ActionError = { code: "bad-qty", detail: "qty " + qty }; // => named error
    return "error [" + err.code + "]: " + err.detail; // => no mutation
  } // => end of the quantity branch
  if (qty > STOCK[id]) {
    // => not enough stock
    const err: ActionError = { code: "out-of-stock", detail: id + " has " + STOCK[id] }; // => named error
    return "error [" + err.code + "]: " + err.detail; // => no mutation
  } // => end of the stock branch
  STOCK[id] -= qty; // => the single mutation, after every check
  return "bought " + qty + " x " + id; // => success reply
} // => end of buy
console.log(buy("kopi-001", 1)); // => Output bought 1 x kopi-001
console.log(buy("susu-009", 3)); // => Output error unknown
console.log(buy("kopi-001", 5)); // => Output error out-of-stock
export {}; // => module scope keeps these names local
