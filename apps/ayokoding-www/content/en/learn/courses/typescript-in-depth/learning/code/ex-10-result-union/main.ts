// => Example 10: Result carries failure as data; callers handle both arms.
type Result<T> = { ok: true; value: T } | { ok: false; error: string }; // => closed outcome union
function divide(a: number, b: number): Result<number> {
  // => total function: never throws
  if (b === 0) {
    // => the failure case, stated first
    return { ok: false, error: "division by zero" }; // => failure as data
  } // => end of if (b === 0)
  return { ok: true, value: a / b }; // => success as data
} // => end of function divide(a: number, b: number): Result<number
for (const pair of [
  [7, 2],
  [7, 0],
]) {
  // => one clean division, one zero divisor
  const [a, b] = pair; // => destructure the operands
  const out = divide(a, b); // => no try needed: failure is a value
  if (out.ok) {
    // => narrowing picks the success arm
    console.log("value:", out.value); // => Output: value: 3.5
  } else {
    // => the failure arm, error known to exist
    console.log("error:", out.error); // => Output: error: division by zero
  } // => end of else
} // => end of for (const pair of [[7, 2], [7, 0]])
