import { expect, test } from "vitest"; // => Runner plus snapshot: one test, one recorded state.
// => Runner imports only: state snapshots need no DOM and no timers.

type CartState = { items: string[]; coupon: string | null }; // => Cart shape: items accumulate, coupon stays singular.
// => State shape: two fields, one transition function, one frozen outcome.

type CartAction = { type: "add"; item: string } | { type: "coupon"; code: string };
// => Action union: each variant is a transition the reducer must handle.

// => Pure reducer: state plus action in, new state out, no side effects.
function cartReducer(state: CartState, action: CartAction): CartState {
  // => Pure reducer: state plus action in, new state out, no side effects.
  // => Reducers snapshot beautifully: total inputs, total outputs, no IO.
  // => Switch on the variant: exhaustiveness keeps new actions honest.
  switch (action.type) {
    // => Switch on the variant: exhaustiveness keeps new actions honest.
    case "add":
      return { ...state, items: [...state.items, action.item] };
    // => Immutable append: new array, same coupon, transition pinned below.
    case "coupon":
      return { ...state, coupon: action.code };
    // => Coupon set: items untouched, the snapshot below proves the spread.
  }
}

test("a sequence of actions reaches the expected state", async () => {
  // => Two transitions, one frozen outcome: the state contract in miniature.
  const empty: CartState = { items: [], coupon: null };
  // => Explicit empty start: snapshots of sequences need a visible origin.
  const withItem = cartReducer(empty, { type: "add", item: "Rice" });
  // => First transition: item appended, coupon still null, immutably.
  // => Second transition: coupon set, items carried over by the spread.
  const withCoupon = cartReducer(withItem, { type: "coupon", code: "SAVE10" });
  // => Second transition: coupon set, items carried over by the spread.
  expect(withCoupon).toMatchSnapshot();
  // => Object snapshot freezes the final state: items plus coupon together.
  // => Pretty-format prints fields sorted: key order never causes diffs.
  expect(empty).toEqual({ items: [], coupon: null });
  // => Immutability twin: the origin state survived both transitions intact.
});
