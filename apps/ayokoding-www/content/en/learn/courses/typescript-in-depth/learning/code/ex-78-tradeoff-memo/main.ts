// => Example 78: memo trades memory for repeated work; the rules say when it pays.
function memo<T, R>(fn: (arg: T) => R): (arg: T) => R {
  // => WHY generic memo: caches by argument
  const cache = new Map<T, R>(); // => argument to result
  return (arg: T) => {
    // => the memoized door
    const hit = cache.get(arg); // => probe
    if (hit !== undefined) {
      // => hit returns at once
      return hit; // => no recompute
    } // => end of if (hit !== undefined)
    const value = fn(arg); // => miss computes once
    cache.set(arg, value); // => stored for later
    return value; // => fresh value out
  }; // => end of return (arg: T) =>
} // => end of function memo<T, R>(fn: (arg: T) => R): (arg: T) =>
let runs = 0; // => counts real computations
const square = memo((n: number) => {
  runs += 1;
  return n * n;
}); // => counted squaring
console.log(square(4), square(4), square(5)); // => Output: 16 16 25, middle call free
console.log("computed:", runs); // => Output: computed: 2, three calls, two computations
const rule = "skip memo when: inputs rarely repeat, results are cheap, or memory is tight"; // => the switching rule
console.log(rule); // => Output: the switching rule
