// Example 67: Exhaustive Narrowing Makes a Missing Case a Type Error. (co-33)
//
// Assigning the switch's default branch to a `never`-typed variable turns exhaustiveness into a
// COMPILE check: if every union member is handled, the default is unreachable (`never`); if a new
// member is added but not handled, it falls through to the default and is NOT `never` -- a type
// error. The "broken" variant below demonstrates that exact error.
//
// Note: "When every type in a union contains a common property with literal types,
// TypeScript ... can narrow out the members of the union." Source: TS Handbook -- Narrowing
// (https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions).

// A four-state union; every member carries the `status` discriminant.
type State =
  | { status: "loading" } // => no payload
  | { status: "error"; message: string } // => payload unique to this branch
  | { status: "success"; data: number[] } // => payload unique to this branch
  | { status: "stale" }; // => handled too -- so the default is genuinely unreachable

// render handles EVERY member; the never-assertion proves nothing falls through.
function render(state: State): string {
  // => co-33: switching on the discriminant narrows; the never check proves exhaustiveness
  switch (state.status) {
    case "loading":
      return "Loading..."; // => narrowed to { status: "loading" }
    case "error":
      return `Error: ${state.message}`; // => narrowed: .message available
    case "success":
      return `OK: ${state.data.join(",")}`; // => narrowed: .data available
    case "stale":
      return "Stale -- refetching"; // => the fourth member, explicitly handled
    default: {
      // => if every case above is handled, `state` is `never` here; an unhandled member is a type error
      const exhaustive: never = state; // => compiles ONLY because no member reaches here
      return exhaustive; // => unreachable
    }
  }
}

console.log(render({ status: "loading" })); // => Output: Loading...
console.log(render({ status: "error", message: "offline" })); // => Output: Error: offline
console.log(render({ status: "success", data: [1, 2] })); // => Output: OK: 1,2
console.log(render({ status: "stale" })); // => Output: Stale -- refetching
