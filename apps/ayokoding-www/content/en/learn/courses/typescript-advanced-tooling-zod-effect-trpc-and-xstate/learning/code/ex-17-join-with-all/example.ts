// => Worked Example 17: independent effects join into one tuple.
// => co-04: in Effect this is Effect.all([a, b]): both run, results pair up.
type Outcome<A, E> = { ok: true; value: A } | { ok: false; error: E }; // => the shared Effect shape
function all2<A, B, E>(first: Outcome<A, E>, second: Outcome<B, E>): Outcome<[A, B], E> {
  // => the tuple join: both outcomes must succeed for the pair to exist
  if (!first.ok) {
    // => first failed: the pair cannot form
    return { ok: false, error: first.error }; // => first error wins
  } // => first succeeded: check the second
  if (!second.ok) {
    // => second failed: the pair cannot form
    return { ok: false, error: second.error }; // => second error surfaces
  } // => both succeeded: fall through
  return { ok: true, value: [first.value, second.value] }; // => the paired values
}
function loadName(id: string): Outcome<string, string> {
  // => first independent fetch: the user name by id
  if (id === "") {
    // => empty ids fetch nothing
    return { ok: false, error: "name: empty id" }; // => typed error value
  } // => id present: fall through
  return { ok: true, value: "Ada" }; // => the fetched name
}
function loadRole(id: string): Outcome<string, string> {
  // => second independent fetch: the user role by id
  if (id === "guest") {
    // => guests have no stored role
    return { ok: false, error: "role: guest has no role" }; // => typed error value
  } // => id has a role: fall through
  return { ok: true, value: "admin" }; // => the fetched role
}
function main(): void {
  // => entry point; the pair forms once and fails once
  // => both fetches succeed, so the tuple forms
  const pair: Outcome<[string, string], string> = all2(loadName("u1"), loadRole("u1")); // => join two successes
  if (pair.ok) {
    // => narrow before reading the tuple
    console.log("pair: " + pair.value[0] + "," + pair.value[1]); // => Output: pair: Ada,admin
  } // => pair done
  // => one fetch fails, so the whole join fails with that error
  const broken: Outcome<[string, string], string> = all2(loadName("u1"), loadRole("guest")); // => second fails
  if (!broken.ok) {
    // => the join error is the failing fetch's error
    console.log("broken: " + broken.error); // => Output: broken: role: guest has no role
  } // => broken done
}
main(); // => run once; a throw exits nonzero
