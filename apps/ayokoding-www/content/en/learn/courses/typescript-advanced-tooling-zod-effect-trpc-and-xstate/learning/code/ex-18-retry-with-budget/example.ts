// => Worked Example 18: retry re-runs a flaky effect until it succeeds or the budget ends.
// => co-04: in Effect this is Effect.retry(effect, Schedule.recurs(2)): policy as data.
type Outcome<A> = { ok: true; value: A } | { ok: false; error: string }; // => value or retryable error
function retry<A>(attempts: number, run: (attempt: number) => Outcome<A>): Outcome<A> {
  // => the retry loop: run, and re-run while attempts remain
  let attempt = 0; // => attempt counter: attempt 0 is the first try
  let last: Outcome<A> = run(0); // => always run at least once
  while (!last.ok && attempt + 1 < attempts) {
    // => failed and budget remains: try again
    attempt = attempt + 1; // => spend one attempt
    last = run(attempt); // => re-run with the new attempt number
  } // => success or budget exhausted: fall through
  return last; // => whatever the last attempt produced
}
function main(): void {
  // => entry point; a flaky fetch succeeds on its third attempt
  // => attempts one and two fail, attempt three succeeds: retry covers the flakiness
  let calls = 0; // => counts how many times the flaky fetch ran
  const flaky = (): Outcome<string> => {
    // => the flaky fetch: fails twice, then succeeds
    calls = calls + 1; // => record the attempt
    if (calls < 3) {
      // => first two attempts fail
      return { ok: false, error: "timeout (attempt " + String(calls) + ")" }; // => retryable error
    } // => third attempt: fall through
    return { ok: true, value: "profile" }; // => success on attempt three
  };
  const result: Outcome<string> = retry(3, () => flaky()); // => budget of three covers the flakiness
  if (result.ok) {
    // => narrow before reading the value
    console.log("flaky: " + result.value + " after=" + String(calls)); // => Output: flaky: profile after=3
  } // => flaky done
  // => a permanently failing fetch exhausts the same budget and keeps its error
  const dead: Outcome<string> = retry(2, () => ({ ok: false, error: "down" })); // => never succeeds
  if (!dead.ok) {
    // => the error is the last attempt's error
    const error: string = dead.error; // => name the error for the print
    console.log("dead: " + error); // => Output: dead: down
  } // => dead done
}
main(); // => run once; a throw exits nonzero
