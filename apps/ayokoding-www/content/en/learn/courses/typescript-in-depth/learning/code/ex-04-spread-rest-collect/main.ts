// => Example 4: spread copies arrays, rest collects arguments; both beat manual loops.
const base = [1, 2, 3]; // => the original stays untouched below
const extended = [...base, 4, 5]; // => WHY spread: copy plus additions in one line
console.log(extended.join(",")); // => Output: 1,2,3,4,5
console.log(base.length); // => Output: 3, the original never grew
function sum(...nums: number[]): number {
  // => WHY rest: callers pass any count
  return nums.reduce((a, b) => a + b, 0); // => the collected array reduces directly
} // => end of function sum(...nums: number[]): number
console.log(sum(1, 2, 3, 4)); // => Output: 10
const [first, ...others] = extended; // => head plus tail destructured together
console.log(first, others.length); // => Output: 1 4
