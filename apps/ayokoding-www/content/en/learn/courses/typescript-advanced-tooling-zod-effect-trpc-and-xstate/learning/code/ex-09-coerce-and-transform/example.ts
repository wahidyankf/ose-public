// => Worked Example 9: coerce and transform turn wire shapes into domain shapes.
// => co-02: in Zod this is z.coerce.number() and .transform((s) => ...).
function toInt(input: unknown): { ok: true; value: number } | { ok: false; issue: string } {
  // => coerce a wire value into an integer, rejecting what cannot convert
  if (typeof input === "number" && Number.isInteger(input)) {
    // => already an integer: no work needed
    return { ok: true, value: input }; // => pass through
  } // => not a number: try the string form
  if (typeof input === "string" && input.trim() !== "" && Number.isInteger(Number(input))) {
    // => numeric strings coerce; blank strings do not
    return { ok: true, value: Number(input) }; // => the coerced integer
  } // => nothing coerced: fall through to failure
  return { ok: false, issue: "expected integer-like, got " + String(input) }; // => uncoercible input rejected
}
function slugify(input: string): string {
  // => transform a title into a URL slug: lowercase, spaces to dashes
  return input
    .toLowerCase() // => slugs are lowercase by convention
    .trim() // => no leading or trailing dashes
    .split(/\s+/) // => split on any whitespace run
    .join("-"); // => rejoin with dashes
}
function main(): void {
  // => entry point; a numeric string coerces, a title transforms
  // => the query string "42" arrives as text and leaves as an integer
  const page = toInt("42"); // => typical query-param shape
  if (page.ok) {
    // => narrow before using the value
    console.log("coerced: value=" + String(page.value)); // => Output: coerced: value=42
  } // => coerce done
  // => garbage does not coerce: the boundary says so explicitly
  const bad = toInt("forty-two"); // => no integer hiding in there
  if (!bad.ok) {
    // => the failure names the input it refused
    console.log("uncoercible: " + bad.issue); // => Output: uncoercible: expected integer-like, got forty-two
  } // => bad done
  // => the transform runs only after validation: slugify never sees garbage
  console.log("slug: " + slugify("Hello Typed World")); // => Output: slug: hello-typed-world
}
main(); // => run once; a throw exits nonzero
