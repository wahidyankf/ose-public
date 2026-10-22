// => Example 49: as const narrows literals; the union then rejects typos.
const MODES = ["read", "write", "admin"] as const; // => WHY as const: tuple of literals, not string[]
type Mode = (typeof MODES)[number]; // => union "read" | "write" | "admin" derived once
function describe(mode: Mode): string {
  // => only the three literals accepted
  return `mode: ${mode}`; // => fixed template
} // => end of function describe(mode: Mode): string
console.log(describe("read")); // => Output: mode: read
console.log(MODES.length); // => Output: 3
const HTTP_OK = 200 as const; // => literal type 200, not number
console.log(HTTP_OK === 200); // => Output: true
