// => Example 48: readonly plus Object.freeze make records mutation-proof at both levels.
const point = Object.freeze({ x: 1, y: 2 }); // => WHY freeze: runtime lock on the object
console.log(point.x, point.y); // => Output: 1 2
interface Flags {
  // => compile-time lock on the shape
  readonly debug: boolean; // => readonly: assignments rejected by tsc
  readonly verbose: boolean; // => same lock, second field
} // => end of interface Flags
const flags: Flags = { debug: true, verbose: false }; // => set once at creation
console.log(flags.debug, flags.verbose); // => Output: true false
function moved(p: { x: number; y: number }, dx: number): { x: number; y: number } {
  // => transform returns new
  return { x: p.x + dx, y: p.y }; // => WHY new object: the input never mutates
} // => end of function moved(p: { x: number; y: number }, dx: numb
console.log(JSON.stringify(moved(point, 10))); // => Output: {"x":11,"y":2}
console.log(point.x); // => Output: 1, the original untouched
