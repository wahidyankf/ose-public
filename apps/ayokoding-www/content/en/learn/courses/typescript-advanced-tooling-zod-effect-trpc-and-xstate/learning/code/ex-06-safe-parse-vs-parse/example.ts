// => Worked Example 6: safeParse returns a value; parse throws.
// => co-02: in Zod, safeParse is for expected failure, parse for impossible failure.
interface Success {
  // => the valid branch: parsed data, ready to use
  ok: true; // => discriminant for narrowing
  name: string; // => trusted payload field
}
interface Failure {
  // => the invalid branch: a message, never an exception
  ok: false; // => discriminant for narrowing
  issue: string; // => what failed, as data
}
function safeParseName(input: unknown): Success | Failure {
  // => the safeParse shape: a union, not a throw
  if (typeof input === "object" && input !== null && typeof (input as Record<string, unknown>)["name"] === "string") {
    // => the check passes: wrap the trusted value
    return { ok: true, name: (input as Record<string, unknown>)["name"] as string }; // => data out, no throw
  } // => check failed: fall through to the failure value
  return { ok: false, issue: "name: expected string" }; // => failure as data, catchable with if
}
// => parse shares the gate: one check, two styles, identical verdicts.
function parseName(input: unknown): string {
  // => the parse shape: data or an exception, nothing in between
  const result: Success | Failure = safeParseName(input); // => reuse the same check
  if (!result.ok) {
    // => failure here is a programmer error, so throwing is honest
    throw new Error(result.issue); // => the throw: only for supposedly-impossible input
  } // => valid: fall through
  return result.name; // => trusted value out
}
function main(): void {
  // => entry point; hostile input meets both styles
  // => the same payload runs twice so the two verdicts can be compared directly.
  // => safeParse turns hostile input into a value the caller branches on
  const hostile: unknown = { name: 42 }; // => wrong-typed but plausible from a form
  const result: Success | Failure = safeParseName(hostile); // => no throw possible
  if (!result.ok) {
    // => branch on the discriminant, never try/catch
    console.log("safe: " + result.issue); // => Output: safe: name: expected string
  } // => safe done
  // => parse turns the same input into a caught exception
  try {
    // => the throwing call must sit inside try
    parseName(hostile); // => throws: the input violates the schema
    console.log("parse: unexpectedly valid"); // => unreachable for this input
  } catch (error) {
    // => the throw lands here
    console.log("parse: threw " + (error as Error).message); // => Output: parse: threw name: expected string
  } // => parse done
}
main(); // => run once; a throw exits nonzero
