// Worked Example 33: Action error to boundary.
// => NusaMart is fictional; every product and quantity here is fixed.
// => Actions fail for real reasons: stock runs out, payments decline. The
// => action throws a named error, the framework catches it at the nearest
// => error boundary, and the visitor sees a fallback instead of a blank page.

// => Fixed stock: only two Kopi left, which the third unit will exceed.
const STOCK: Record<string, number> = { "kopi-001": 2 }; // => fictional stock

// => Named action errors: each carries the code the boundary switches on.
type ActionError = { code: "out-of-stock" | "bad-qty"; detail: string }; // => error shape

// => The action either mutates or throws: no silent half-success exists.
// => Throwing here models the framework behavior of routing to error.tsx.
function buy(id: string, qty: number): string {
  // => buying action
  if (qty < 1) {
    // => bad quantity
    const err: ActionError = { code: "bad-qty", detail: "qty " + qty }; // => named error
    throw err; // => boundary catches this
  } // => end of the quantity branch
  const left = STOCK[id] ?? 0; // => stock on hand, zero when unknown
  if (qty > left) {
    // => not enough stock
    const err: ActionError = { code: "out-of-stock", detail: id + " has " + left }; // => named error
    throw err; // => boundary catches this
  } // => end of the stock branch
  STOCK[id] = left - qty; // => the mutation
  return "bought " + qty + " x " + id; // => success reply
} // => end of buy

// => The boundary: run the action, render its reply on success and the
// => matching fallback on each named failure.
function boundary(id: string, qty: number): string {
  // => error boundary
  try {
    // => attempt the action
    return buy(id, qty); // => success renders the reply
  } catch (e) {
    // => action threw
    const err = e as ActionError; // => the named error
    return "fallback [" + err.code + "]: " + err.detail; // => fallback renders instead
  } // => end of the catch
} // => end of boundary

console.log(boundary("kopi-001", 1)); // => Output bought 1 x kopi-001
console.log(boundary("kopi-001", 5)); // => Output fallback out-of-stock with 1 left
console.log(boundary("kopi-001", 0)); // => Output fallback bad-qty
export {}; // => module scope keeps these names local
