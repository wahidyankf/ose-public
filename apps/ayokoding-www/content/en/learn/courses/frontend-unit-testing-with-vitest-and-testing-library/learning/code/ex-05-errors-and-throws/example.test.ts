import { expect, test } from "vitest";
// => No new runner API: throws are asserted through expect, like values.

class NegativeAgeError extends Error {
  // => A named error class turns a string message into a catchable contract.
  // => Callers can branch on the class; tests can pin it down exactly.
  constructor(age: number) {
    // => The constructor takes the offending value, not a prebuilt message.
    super(`Age must be non-negative, got ${age}`);
    // => The message embeds the bad input so logs diagnose without reruns.
    this.name = "NegativeAgeError";
    // => Setting name keeps stack traces and serializers honest.
  }
}

function validateAge(age: number): number {
  // => Validation either returns clean data or throws: never a silent default.
  // => The return type promises a valid age; the throw enforces the promise.
  if (age < 0) throw new NegativeAgeError(age);
  // => Throw the specific class, never a bare Error, so callers can react.
  // => Throwing beats returning null: invalid ages cannot slip through silently.
  return age;
  // => The happy path returns the input unchanged: validation, not repair.
}

test("rejects a negative age with the named error", async () => {
  // => Wrap the throwing call in a closure: expect needs a function to run.
  // => Calling validateAge directly would throw before expect sees anything.
  expect(() => validateAge(-3)).toThrow(NegativeAgeError);
  // => The class argument asserts the contract, not just that something threw.
  // => A refactor that throws RangeError instead now fails this test loudly.
});

test("the message names the offending value", async () => {
  // => Messages are user-facing; pinning them stops vague-error regressions.
  expect(() => validateAge(-3)).toThrow("got -3");
  // => A substring match is enough: full-message matches rot on rewording.
  // => Substring plus class (previous test) covers contract and diagnosis.
});

test("accepts the boundary value zero", async () => {
  // => Every throw test needs its boundary twin, or the guard may be too wide.
  expect(validateAge(0)).toBe(0);
  // => Zero is valid: the guard is strictly-less-than, proved right here.
});
