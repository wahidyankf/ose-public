// => Worked Example 13: catch one error by tag and let the other pass through.
// => co-03: in Effect this is Effect.catchTag(effect, "NotFound", () => fallback).
// => co-04: catching is composition: the pipeline continues with the fallback value.
class NotFound {
  // => the recoverable failure: a default fills it
  readonly tag = "NotFound"; // => the tag the catcher matches
  readonly id: string; // => context for the log line
  constructor(id: string) {
    // => plain parameter: strip-safe, assigned explicitly
    this.id = id; // => context stored on the instance
  }
}
class Forbidden {
  // => the unrecoverable failure: no default may invent permission
  readonly tag = "Forbidden"; // => a different tag, so the catcher skips it
  readonly id: string; // => context for the log line
  constructor(id: string) {
    // => plain parameter: strip-safe, assigned explicitly
    this.id = id; // => context stored on the instance
  }
}
type Outcome<A, E> = { ok: true; value: A } | { ok: false; error: E }; // => the shared Effect shape
// => The catcher is selective by construction: tag match recovers, anything else passes through.
function catchNotFound<E>(result: Outcome<string, NotFound | E>, fallback: string): Outcome<string, E> {
  // => catchTag for one tag: NotFound becomes the fallback, every other error passes through
  if (!result.ok && result.error instanceof NotFound) {
    // => tag match: recover with the fallback value
    return { ok: true, value: fallback + " (default for " + result.error.id + ")" }; // => recovered: error gone
  } // => no match: fall through untouched
  return result as Outcome<string, E>; // => Forbidden (or success) passes through unchanged
}
function main(): void {
  // => entry point; the same catcher meets a miss, a denial, and a hit
  // => a miss it heals, a denial it keeps: selectivity proven both directions.
  // => a miss is caught: the fallback value continues the pipeline
  const miss: Outcome<string, NotFound | Forbidden> = { ok: false, error: new NotFound("memo") }; // => recoverable failure
  const caught: Outcome<string, Forbidden> = catchNotFound(miss, "guest-doc"); // => catch the NotFound only
  if (caught.ok) {
    // => recovered: the pipeline sees a value, not an error
    console.log("caught: " + caught.value); // => Output: caught: guest-doc (default for memo)
  } // => caught done
  // => a denial passes through the same catcher untouched
  const denied: Outcome<string, NotFound | Forbidden> = { ok: false, error: new Forbidden("secret") }; // => unrecoverable failure
  const kept: Outcome<string, Forbidden> = catchNotFound(denied, "guest-doc"); // => tag does not match
  if (!kept.ok) {
    // => still an error, and still the Forbidden one
    console.log("kept: " + kept.error.tag + " id=" + kept.error.id); // => Output: kept: Forbidden id=secret
  } // => kept done
}
main(); // => run once; a throw exits nonzero
