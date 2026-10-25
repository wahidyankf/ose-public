// => Worked Example 7: JSON.parse returns unknown; the schema decides what it means.
// => co-02: every network boundary is a parse-dont-validate moment.
// => co-13: TypeScript checks the code at compile time; only the schema checks the wire at runtime.
interface User {
  // => the trusted type: exists only after the boundary check passes
  id: number; // => must arrive as a number, not a numeric string
  email: string; // => must arrive as a string containing an at-sign
}
function parseUserJson(text: string): { ok: true; user: User } | { ok: false; issue: string } {
  // => the whole boundary in one function: text in, trusted user or issue out
  let raw: unknown; // => JSON.parse can produce anything: typed unknown on purpose
  try {
    // => malformed JSON is the first failure mode
    raw = JSON.parse(text); // => still unknown: parsing text never proves shape
  } catch {
    // => syntax failure carries no schema information
    return { ok: false, issue: "malformed JSON" }; // => reject before any field read
  } // => text is valid JSON; shape still unknown
  if (typeof raw !== "object" || raw === null) {
    // => primitives and null cannot be users
    return { ok: false, issue: "expected object" }; // => reject the wrong top-level kind
  } // => object confirmed
  const record = raw as Record<string, unknown>; // => narrow once for key reads
  if (typeof record["id"] !== "number") {
    // => a string "7" is not an id: no silent coercion at the boundary
    return { ok: false, issue: "id: expected number" }; // => strictness is the feature
  } // => id settled
  if (typeof record["email"] !== "string" || !record["email"].includes("@")) {
    // => the cheapest email check: a real schema would use .email()
    return { ok: false, issue: "email: expected email string" }; // => shape right, content wrong
  } // => email settled
  return { ok: true, user: { id: record["id"], email: record["email"] } }; // => trusted user out
}
function main(): void {
  // => entry point; one honest payload, one lying payload
  // => honest JSON passes straight through to a trusted user
  const good = parseUserJson('{"id":7,"email":"ada@example.com"}'); // => the wire tells the truth
  if (good.ok) {
    // => narrow before reading the user
    console.log("good: id=" + String(good.user.id) + " email=" + good.user.email); // => Output: good: id=7 email=ada@example.com
  } // => good done
  // => a numeric-string id lies about its type and the boundary catches it
  const lying = parseUserJson('{"id":"7","email":"ada@example.com"}'); // => id is a string on the wire
  if (!lying.ok) {
    // => the failure names the field, not the whole payload
    console.log("lying: " + lying.issue); // => Output: lying: id: expected number
  } // => lying done
}
main(); // => run once; a throw exits nonzero
