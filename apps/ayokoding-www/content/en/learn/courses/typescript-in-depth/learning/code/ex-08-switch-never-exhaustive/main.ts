// => Example 8: a switch over a union plus never proves every case is handled.
type Shape = { kind: "circle"; r: number } | { kind: "square"; s: number }; // => closed union, two members
function area(shape: Shape): number {
  // => every member must map to a number
  switch (
    shape.kind // => WHY switch: the discriminant narrows each branch
  ) {
    case "circle": // => narrowed to the circle member here
      return Math.PI * shape.r * shape.r; // => r is known to exist
    case "square": // => narrowed to the square member here
      return shape.s * shape.s; // => s is known to exist
    default: // => unreachable while the union stays covered
      const check: never = shape; // => WHY never: a new member breaks compilation here
      throw new Error(`unhandled shape: ${JSON.stringify(check)}`); // => documents the impossible
  } // => end of switch (shape.kind)
} // => end of function area(shape: Shape): number
console.log(area({ kind: "circle", r: 1 }).toFixed(2)); // => Output: 3.14
console.log(area({ kind: "square", s: 3 })); // => Output: 9
