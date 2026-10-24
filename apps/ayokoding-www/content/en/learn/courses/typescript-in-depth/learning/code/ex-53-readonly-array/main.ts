// => Example 53: ReadonlyArray plus non-mutating methods keep collections stable.
function total(items: ReadonlyArray<number>): number {
  // => WHY readonly: callers know it never mutates
  return items.reduce((n, x) => n + x, 0); // => reduce reads only
} // => end of function total(items: ReadonlyArray<number>): number
const nums = [3, 1, 2]; // => plain array, passed as readonly
console.log(total(nums)); // => Output: 6
const sorted = [...nums].sort((a, b) => a - b); // => WHY copy-then-sort: sort mutates in place
console.log(sorted.join(","), nums.join(",")); // => Output: 1,2,3 then 3,1,2, original kept
const doubled = nums.map((n) => n * 2); // => map returns new, never mutates
console.log(doubled.join(","), nums.length); // => Output: 6,2,4 then 3
