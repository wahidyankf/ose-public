// => Example 5: map-filter-sort chains read left to right, the way data flows.
const words = ["ada", "grace hopper", "alan", "margaret"]; // => raw mixed-length input
const long = words // => the pipeline reads as one sentence
  .filter((w) => w.length > 4) // => keep only names longer than four chars
  .map((w) => w.toUpperCase()) // => shout the survivors
  .sort(); // => fixed order: byte-stable output
console.log(long.join("|")); // => Output: GRACE HOPPER|MARGARET
const total = words.reduce((n, w) => n + w.length, 0); // => WHY reduce: one pass to a scalar
console.log(total); // => Output: 27, every name counted once
const nested = [[1, 2], [3], [4, 5]]; // => grouped numbers
console.log(nested.flatMap((g) => g).join(",")); // => Output: 1,2,3,4,5, one level flattened
