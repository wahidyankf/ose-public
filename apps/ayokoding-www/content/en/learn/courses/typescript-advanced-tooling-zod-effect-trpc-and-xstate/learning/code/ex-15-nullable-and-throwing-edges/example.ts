// => Worked Example 15: nullables and exceptions enter the typed world at one gate.
// => co-03: in Effect this is Option.fromNullable and Effect.try: untyped edges in, typed errors out.
// => co-02: the gate sits at the boundary, like a Zod schema for control flow.
class EmptyName {
  // => the typed error for a blank-or-missing name
  readonly tag = "EmptyName"; // => catchable by tag downstream
}
class JsonError {
  // => the typed error for a throwing JSON.parse
  readonly tag = "JsonError"; // => the throw is converted, never propagated
  readonly detail: string; // => the original message, preserved as data
  constructor(detail: string) {
    // => plain parameter: strip-safe, assigned explicitly
    this.detail = detail; // => message stored on the instance
  }
}
type Outcome<A, E> = { ok: true; value: A } | { ok: false; error: E }; // => the shared Effect shape
// => Nullables enter here: three empty shapes become one typed error.
function fromNullable(value: string | null | undefined): Outcome<string, EmptyName> {
  // => Option.fromNullable shape: null and undefined become one typed error
  if (value === null || value === undefined || value.length === 0) {
    // => all three empty shapes share one failure
    return { ok: false, error: new EmptyName() }; // => typed error, no null downstream
  } // => present and non-empty: fall through
  return { ok: true, value: value }; // => narrowed to string by the check
}
// => Throws enter here: the single fenced try in the whole program.
function tryJson(text: string): Outcome<unknown, JsonError> {
  // => Effect.try shape: a throwing call becomes a typed error
  try {
    // => the only throwing call in the program, fenced here
    return { ok: true, value: JSON.parse(text) }; // => success still untyped: shape comes next
  } catch (error) {
    // => the throw is caught at the gate and converted
    return { ok: false, error: new JsonError((error as Error).message) }; // => message preserved as data
  } // => gate done
}
function main(): void {
  // => entry point; a missing name and a broken payload both become typed errors
  // => null enters the gate and leaves as an EmptyName, never as a null
  const name: Outcome<string, EmptyName> = fromNullable(null); // => the nullable edge
  if (!name.ok) {
    // => the error branch names the tag
    console.log("nullable: " + name.error.tag); // => Output: nullable: EmptyName
  } // => nullable done
  // => broken JSON enters the gate and leaves as a JsonError, never as a throw
  const parsed: Outcome<unknown, JsonError> = tryJson("{oops"); // => the throwing edge
  if (!parsed.ok) {
    // => the error branch names the tag
    console.log("throwing: " + parsed.error.tag); // => Output: throwing: JsonError
  } // => throwing done
}
main(); // => run once; a throw exits nonzero
