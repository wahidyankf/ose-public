// => Example 63: indexed access may miss; the flag makes the compiler say so.
function at<T>(items: T[], i: number): T | undefined {
  // => honest signature under the flag
  return items[i]; // => T | undefined: the hole is visible
} // => end of function at<T>(items: T[], i: number): T | undefined
const row = ["a", "b"]; // => two elements
console.log(at(row, 0) ?? "missing"); // => Output: a
console.log(at(row, 9) ?? "missing"); // => Output: missing, no silent undefined
