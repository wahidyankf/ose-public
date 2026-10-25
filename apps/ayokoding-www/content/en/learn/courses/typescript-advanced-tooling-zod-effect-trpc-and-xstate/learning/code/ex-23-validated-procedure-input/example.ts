// => Worked Example 23: a Zod schema guards the procedure input.
// => co-07: in tRPC this is .input(z.object({...})): validation before the handler.
// => co-01: the same schema object validates at the boundary and types the handler.
interface NewUser {
  // => the trusted input type: what the schema guarantees the handler
  name: string; // => non-empty after the check
  age: number; // => integer thirteen or older after the check
}
function checkNewUser(input: unknown): { ok: true; value: NewUser } | { ok: false; issue: string } {
  // => the Zod-shaped gate: z.object({ name: z.string().min(1), age: z.number().int().min(13) })
  if (typeof input !== "object" || input === null) {
    // => non-objects carry no fields
    return { ok: false, issue: "expected object" }; // => reject before any field read
  } // => object confirmed
  const record = input as Record<string, unknown>; // => narrow once for key reads
  if (typeof record["name"] !== "string" || record["name"].length === 0) {
    // => z.string().min(1): present and non-empty
    return { ok: false, issue: "name: expected non-empty string" }; // => field named
  } // => name settled
  if (typeof record["age"] !== "number" || !Number.isInteger(record["age"]) || record["age"] < 13) {
    // => z.number().int().min(13): integer and old enough
    return { ok: false, issue: "age: expected integer 13 or older" }; // => field named
  } // => age settled
  return { ok: true, value: { name: record["name"], age: record["age"] } }; // => trusted input out
}
function createUser(input: NewUser): string {
  // => the mutation handler: runs only on schema-valid input
  return "created " + input.name + " (" + String(input.age) + ")"; // => no re-checking inside
}
function main(): void {
  // => entry point; valid input creates, invalid input stops at the gate
  // => honest input passes the gate and the handler runs
  const good = checkNewUser({ name: "Ada", age: 36 }); // => valid signup payload
  if (good.ok) {
    // => narrow before calling the handler
    console.log("created: " + createUser(good.value)); // => Output: created: created Ada (36)
  } // => good done
  // => a blank name stops at the gate: the handler never runs
  const bad = checkNewUser({ name: "", age: 36 }); // => blank-name payload
  if (!bad.ok) {
    // => the gate error names the field
    console.log("rejected: " + bad.issue); // => Output: rejected: name: expected non-empty string
  } // => bad done
}
main(); // => run once; a throw exits nonzero
