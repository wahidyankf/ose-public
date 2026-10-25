// => Worked Example 16: andThen chains steps; the first failure stops the chain.
// => co-04: in Effect this is pipe(parse, Effect.andThen(validate), Effect.andThen(save)).
type Outcome<A, E> = { ok: true; value: A } | { ok: false; error: E }; // => the shared Effect shape
function andThen<A, B, E>(first: Outcome<A, E>, next: (value: A) => Outcome<B, E>): Outcome<B, E> {
  // => the chain combinator: run next only when first succeeded
  if (!first.ok) {
    // => first failed: next never runs, the error passes through
    return first; // => short-circuit with the original error
  } // => first succeeded: fall through with its value
  return next(first.value); // => feed the value into the next step
}
function parseAge(input: unknown): Outcome<number, string> {
  // => step one: untrusted input becomes a number or an error
  if (typeof input !== "number" || !Number.isInteger(input)) {
    // => not an integer: the pipeline stops here
    return { ok: false, error: "age: expected integer" }; // => typed error value
  } // => integer confirmed
  return { ok: true, value: input }; // => trusted number out
}
function checkAdult(age: number): Outcome<number, string> {
  // => step two: the business rule, same error channel
  if (age < 13) {
    // => too young: same channel, new message
    return { ok: false, error: "age: must be 13 or older" }; // => typed error value
  } // => old enough: fall through
  return { ok: true, value: age }; // => age passes both steps
}
function main(): void {
  // => entry point; three inputs take three different exits
  // => a valid adult flows through both steps to a value
  const adult: Outcome<number, string> = andThen(parseAge(36), checkAdult); // => both steps run
  if (adult.ok) {
    // => narrow before reading the value
    console.log("adult: " + String(adult.value)); // => Output: adult: 36
  } // => adult done
  // => a wrong-typed input stops at step one: step two never sees it
  const wrong: Outcome<number, string> = andThen(parseAge("old"), checkAdult); // => first step fails
  if (!wrong.ok) {
    // => the error names the first step
    console.log("wrong: " + wrong.error); // => Output: wrong: age: expected integer
  } // => wrong done
  // => a young age stops at step two with the business-rule error
  const young: Outcome<number, string> = andThen(parseAge(9), checkAdult); // => second step fails
  if (!young.ok) {
    // => the error names the second step
    console.log("young: " + young.error); // => Output: young: age: must be 13 or older
  } // => young done
}
main(); // => run once; a throw exits nonzero
