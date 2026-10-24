// => Kata 1 solution: failure as data; the total function never throws.
type Result<T> = { ok: true; value: T } | { ok: false; error: string }; // => outcome union
function priceOf(item: string): Result<number> {
  // => total function
  const prices: Record<string, number> = { lamp: 25, desk: 150 }; // => known catalog
  const price = prices[item]; // => lookup may miss
  if (price === undefined) {
    // => absence as data
    return { ok: false, error: `unknown item: ${item}` }; // => failure value
  } // => end of if (price === undefined)
  return { ok: true, value: price }; // => success value
} // => end of function priceOf(item: string): Result<number>
const cart = ["lamp", "pen", "desk"]; // => one unknown item inside
let total = 0; // => running total
const missing: string[] = []; // => collected failures
for (const item of cart) {
  // => every item handled, none thrown
  const out = priceOf(item); // => no try needed
  if (out.ok) {
    // => success arm
    total += out.value; // => accumulate
  } else {
    // => failure arm
    missing.push(out.error); // => collect
  } // => end of else
} // => end of for (const item of cart)
console.log("total:", total); // => Output: total: 175
console.log("missing:", missing.join("; ")); // => Output: missing: unknown item: pen
