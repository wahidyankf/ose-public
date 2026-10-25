// => Kata 1 solution: one schema gate checks every field, including age.
// => The manual guard is gone: email and age validate in the same place.
function checkSignup(input: unknown): { ok: true } | { ok: false; issue: string } {
  // => the schema gate: every field checked, failures named
  if (typeof input !== "object" || input === null) {
    // => non-objects carry no fields
    return { ok: false, issue: "expected object" }; // => reject before any field read
  } // => object confirmed
  const record = input as Record<string, unknown>; // => narrow once for key reads
  if (typeof record["email"] !== "string" || !record["email"].includes("@")) {
    // => the email rule the hand-rolled guard had
    return { ok: false, issue: "email: expected email string" }; // => field named
  } // => email settled
  if (typeof record["age"] !== "number" || !Number.isInteger(record["age"]) || record["age"] < 13) {
    // => the age rule the hand-rolled guard forgot
    return { ok: false, issue: "age: expected integer 13 or older" }; // => field named
  } // => age settled
  return { ok: true }; // => every field valid
}
function main(): void {
  // => entry point; the same bad payload now fails at the gate
  // => the negative age is rejected with the field named
  const bad = checkSignup({ email: "ada@example.com", age: -3 }); // => hostile payload
  if (!bad.ok) {
    // => the failure names the forgotten field
    console.log("schema says: false (" + bad.issue + ")"); // => fixed: the gate catches the age
  } // => bad done
  // => an honest payload still passes untouched
  const good = checkSignup({ email: "ada@example.com", age: 36 }); // => valid payload
  console.log("good: " + String(good.ok)); // => valid input unaffected
}
main(); // => run once; a throw exits nonzero
