// Worked Example 30: Optimistic cart update.
// => NusaMart is fictional; every product and quantity here is fixed.
// => Waiting for the server on every click feels slow: an optimistic update
// => applies the intent instantly, then confirms or rolls back when the
// => reply lands. The cart keeps both numbers: shown and confirmed.

// => The cart holds a confirmed count the server blessed and a shown count
// => the visitor already sees; the gap between them is the pending intent.
type Cart = { shown: number; confirmed: number }; // => two-number cart
const cart: Cart = { shown: 0, confirmed: 0 }; // => empty cart

// => Apply the click instantly: the shown count moves now, confirmation
// => comes later. This is the optimism.
function click(qty: number): void {
  // => instant apply
  cart.shown += qty; // => visitor sees the new count now
} // => end of click

// => Settle one pending intent: success moves confirmed up to shown, and
// => failure rolls shown back down so the display tells the truth again.
function settle(ok: boolean, qty: number): string {
  // => reply handler
  if (ok) {
    // => server blessed the intent
    cart.confirmed += qty; // => confirmed catches up
    return "confirmed " + cart.confirmed + " shown " + cart.shown; // => counts agree
  } // => end of the success branch
  cart.shown -= qty; // => rollback the unblessed intent
  return "rolled back to shown " + cart.shown; // => display tells the truth
} // => end of settle

click(2); // => visitor adds two Kopi instantly
console.log("after click: shown " + cart.shown + " confirmed " + cart.confirmed); // => Output 2 and 0
console.log("server ok: " + settle(true, 2)); // => Output confirmed 2 shown 2
click(5); // => visitor adds five Teh instantly
console.log("second click: shown " + cart.shown + " confirmed " + cart.confirmed); // => Output 7 and 2
console.log("server rejects: " + settle(false, 5)); // => Output rolled back to shown 2
export {}; // => module scope keeps these names local
