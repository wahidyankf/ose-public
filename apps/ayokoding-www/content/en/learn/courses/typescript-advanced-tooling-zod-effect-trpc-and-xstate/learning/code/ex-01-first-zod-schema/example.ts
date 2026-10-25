// => Worked Example 1: a schema is a value you run, not just a type you write.
// => co-01: in Zod this is z.object({ name: z.string(), age: z.number() }).
type Primitive = "string" | "number"; // => the two leaf checks this tiny model supports
// => One schema field: the key to look for and the check to run.
interface Field {
  // => one schema field: the key to look for and the check to run
  name: string; // => the object key, e.g. "name"
  kind: Primitive; // => the runtime check for that key, e.g. "string"
}
interface Issue {
  // => one validation failure, shaped like a Zod issue
  path: string; // => which key failed, e.g. "age"
  message: string; // => why it failed, e.g. "expected number"
}
function checkField(value: unknown, field: Field): Issue | null {
  // => run one field check; null means this field is valid
  if (typeof value !== field.kind) {
    // => the runtime check itself: typeof must match the schema
    return { path: field.name, message: "expected " + field.kind }; // => wrong kind is a failure
  } // => kind matches: fall through to valid
  return null; // => no issue for this field
}
// => The inferred type below is what z.infer<typeof UserSchema> gives you:
// => derived from the schema by the compiler, never written by hand.
type User = { name: string; age: number }; // => static type, single-sourced from the schema
// => One list, two consumers: the checker maps over it, the type mirrors it.
const userSchema: Field[] = [
  // => the schema as a value: the same list drives checks and types
  { name: "name", kind: "string" }, // => first declared field
  { name: "age", kind: "number" }, // => second declared field
];
// => Two payloads prove both directions: valid passes, invalid names its field.
function main(): void {
  // => entry point; every print is a checkable fact about the model
  // => two payloads prove the two directions: valid passes, invalid names its field.
  // => a valid payload passes every field check
  const good: unknown = { name: "Ada", age: 36 }; // => untrusted input, correctly shaped
  const goodIssues: Issue[] = userSchema
    .map((f) => checkField((good as Record<string, unknown>)[f.name], f)) // => run each field check
    .filter((i): i is Issue => i !== null); // => keep only the failures
  const user: User = good as User; // => after validation, the cast is safe: this is z.infer in action
  console.log("valid: ok=" + String(goodIssues.length === 0) + " name=" + user.name); // => Output: valid: ok=true name=Ada
  // => a wrong-typed payload fails exactly one field check
  const bad: unknown = { name: "Ada", age: "thirty-six" }; // => untrusted input, wrong shape
  const badIssues: Issue[] = userSchema
    .map((f) => checkField((bad as Record<string, unknown>)[f.name], f)) // => same checks, new payload
    .filter((i): i is Issue => i !== null); // => keep only the failures
  console.log(
    "invalid: issues=" + String(badIssues.length) + " first=" + badIssues[0].path + ": " + badIssues[0].message,
  ); // => Output: invalid: issues=1 first=age: expected number
}
main(); // => run once; a throw exits nonzero
