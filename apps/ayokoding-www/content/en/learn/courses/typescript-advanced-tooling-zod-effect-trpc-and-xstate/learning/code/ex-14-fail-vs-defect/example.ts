// => Worked Example 14: expected failures are values; only bugs are defects.
// => co-03: in Effect, fail is typed and catchable, die is an unrecoverable defect.
// => co-13: the compiler cannot check this split; the Effect model enforces it at runtime.
type Expected = { kind: "expected"; message: string }; // => a failure the signature admits
type Outcome<A> = { ok: true; value: A } | { ok: false; expected: Expected } | { crashed: true; defect: string }; // => three lanes: value, error, defect
function divide(a: number, b: number): Outcome<number> {
  // => division by zero is expected: it rides the error lane, never the defect lane
  if (b === 0) {
    // => a documented failure mode, not a bug
    return { ok: false, expected: { kind: "expected", message: "division by zero" } }; // => typed error value
  } // => divisor fine: fall through
  return { ok: true, value: a / b }; // => success value
}
function crashDemo(): Outcome<number> {
  // => a genuine bug: the defect lane, unreachable by catchTag-style handlers
  return { crashed: true, defect: "null dereference in divide" }; // => defects skip error handling
}
function runLane(result: Outcome<number>): string {
  // => one runner that treats the three lanes differently
  if ("crashed" in result && result.crashed) {
    // => defects are reported, never recovered here
    return "defect: " + result.defect; // => crash line: needs a code fix, not a fallback
  } // => not a defect: narrow to the two recoverable lanes
  if (!result.ok) {
    // => expected failure: handled like any other value
    return "handled: " + result.expected.message; // => handled line: the program continues
  } // => success: fall through
  return "value: " + String(result.value); // => success line
}
function main(): void {
  // => entry point; success, expected failure, and defect each take their lane
  // => normal division lands on the success lane
  console.log(runLane(divide(7, 2))); // => Output: value: 3.5
  // => division by zero lands on the expected-failure lane, handled not thrown
  console.log(runLane(divide(7, 0))); // => Output: handled: division by zero
  // => the bug lands on the defect lane: visible, uncaught, demanding a fix
  console.log(runLane(crashDemo())); // => Output: defect: null dereference in divide
}
main(); // => run once; a throw exits nonzero
