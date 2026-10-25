// => Worked Example 32: exactly one tab stop serves a whole group.
// => co-08: roving tabindex keeps Tab moving between groups, arrows within.
function tabStops(members: number, active: number): number[] {
  // => assign tabindex per member: the active one gets 0, the rest -1
  return members <= 0 ? [] : Array.from({ length: members }, (_, i) => (i === active ? 0 : -1)); // => one zero, the rest minus one
}
function main(): void {
  // => entry point; four tabs, one stop, then the stop moves
  console.log("stops: " + tabStops(4, 1).join(",")); // => Output: stops: -1,0,-1,-1
  console.log("zero count: " + String(tabStops(4, 1).filter((t) => t === 0).length)); // => Output: zero count: 1
  console.log("after arrow: " + tabStops(4, 2).join(",")); // => Output: after arrow: -1,-1,0,-1
}
main(); // => run once; a throw exits nonzero
