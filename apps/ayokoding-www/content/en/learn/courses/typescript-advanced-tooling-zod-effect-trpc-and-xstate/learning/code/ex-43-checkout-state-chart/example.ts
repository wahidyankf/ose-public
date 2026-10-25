// => Worked Example 43: a checkout chart nests, guards, and rejects impossible moves.
// => co-09: nested cart, guarded payment, and parallel confirmation in one machine.
// => co-11: paying twice and shipping before payment have no transitions: unrepresentable.
type CheckoutState = "cart.browsing" | "cart.reviewing" | "payment.card" | "payment.done" | "shipped"; // => dotted nested states plus terminal states
type CheckoutEvent = { type: "REVIEW" } | { type: "BACK" } | { type: "PAY"; card: boolean } | { type: "SHIP" }; // => cart events, guarded pay, ship
// => The chart: nested cart moves, guarded payment, ship only after payment.
function checkoutNext(
  current: CheckoutState,
  event: CheckoutEvent,
): { ok: true; state: CheckoutState } | { ok: false; rejected: string } {
  // => the chart: nested cart moves, guarded payment, ship allowed only after payment
  if (current === "cart.browsing" && event.type === "REVIEW") {
    // => nested move inside the cart parent
    return { ok: true, state: "cart.reviewing" }; // => browsing to reviewing
  } // => review move done
  if (current === "cart.reviewing" && event.type === "BACK") {
    // => nested move back inside the cart parent
    return { ok: true, state: "cart.browsing" }; // => reviewing to browsing
  } // => back move done
  if (current === "cart.reviewing" && event.type === "PAY") {
    // => the guarded exit from the cart: payment needs a card
    if (!event.card) {
      // => guard fails: no card on file
      return { ok: false, rejected: "PAY refused: no card" }; // => impossible move named
    } // => guard passes: fall through
    return { ok: true, state: "payment.card" }; // => into payment
  } // => pay move done
  if (current === "payment.card" && event.type === "PAY") {
    // => paying twice: no transition exists, because done means done
    return { ok: false, rejected: "PAY refused in payment.card: use SHIP" }; // => double-pay unrepresentable
  } // => double-pay done
  if (current === "payment.card" && event.type === "SHIP") {
    // => ship allowed only after payment completed its state
    return { ok: true, state: "shipped" }; // => terminal state
  } // => ship done
  if (current === "cart.browsing" && event.type === "SHIP") {
    // => shipping before payment: no path exists through the chart
    return { ok: false, rejected: "SHIP refused in cart.browsing: pay first" }; // => early ship unrepresentable
  } // => early ship done
  return { ok: false, rejected: "no transition: " + event.type + " in " + current }; // => every other pair refused
}
// => The happy path ships; two impossible moves are refused.
function main(): void {
  // => entry point; the happy path ships, two impossible moves are refused
  // => browse, review, pay with a card, ship: the one legal path
  let state: CheckoutState = "cart.browsing"; // => starts browsing
  const path: Array<{ type: "REVIEW" } | { type: "BACK" } | { type: "PAY"; card: boolean } | { type: "SHIP" }> = [
    // => the happy-path event script
    { type: "REVIEW" }, // => into reviewing
    { type: "PAY", card: true }, // => guarded pay passes
    { type: "SHIP" }, // => ship after payment
  ];
  // => Walk the happy-path script through the chart, one transition at a time.
  for (const event of path) {
    // => walk the script through the chart
    const next = checkoutNext(state, event); // => each event must transition
    if (next.ok) {
      // => legal move: advance
      state = next.state; // => new current state
    } // => illegal moves cannot happen on the happy path
  }
  console.log("shipped: " + state); // => Output: shipped: shipped
  // => paying twice is refused: payment.card has no PAY transition
  const double = checkoutNext("payment.card", { type: "PAY", card: true }); // => second payment attempt
  if (!double.ok) {
    // => the refusal names the correct next event
    console.log("double pay: " + double.rejected); // => Output: double pay: PAY refused in payment.card: use SHIP
  } // => double done
  // => shipping from the cart is refused: payment must come first
  const early = checkoutNext("cart.browsing", { type: "SHIP" }); // => ship before paying
  if (!early.ok) {
    // => the refusal names the missing step
    console.log("early ship: " + early.rejected); // => Output: early ship: SHIP refused in cart.browsing: pay first
  } // => early done
}
main(); // => run once; a throw exits nonzero
