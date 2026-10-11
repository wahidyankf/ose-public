// Example 66: Modeling loading error success as a Discriminated Union. (co-33)
//
// Model async UI state as a discriminated union: each branch shares a `status` literal that narrows
// the rest of the shape. `loading` has no data; `error` has a message; `success` has the data. The
// `status` field is the discriminant TypeScript narrows on.
//
// Note: "When every type in a union contains a common property with literal types,
// TypeScript ... can narrow out the members of the union." Source: TS Handbook -- Narrowing
// (https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions).

// The three-state union; `status` is the discriminant (the common literal field).
type AsyncState<T> =
  | { status: "loading" } // => no data yet
  | { status: "error"; message: string } // => `message` exists ONLY in this branch
  | { status: "success"; data: T }; // => `data` exists ONLY in this branch
// => narrowing on `status` makes `message`/`data` safely available in their own branches only

// render branches on the discriminant; each branch sees only its own extra fields.
function render<T>(state: AsyncState<T>): string {
  // => co-33: switching on `status` narrows the union, so .message/.data are type-safe here
  switch (state.status) {
    case "loading":
      return "Loading..."; // => no .data access possible (and none needed)
    case "error":
      return `Error: ${state.message}`; // => narrowed: .message is available
    case "success":
      return `Data: ${JSON.stringify(state.data)}`; // => narrowed: .data is available
  }
}

const states: AsyncState<number[]>[] = [
  { status: "loading" }, // => the pending branch
  { status: "error", message: "network unreachable" }, // => the error branch
  { status: "success", data: [1, 2, 3] }, // => the success branch
];

states.forEach((s) => console.log(render(s))); // => Output: three lines, one per branch
