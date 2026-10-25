// => Worked Example 24: mutations return typed errors, not status codes.
// => co-07: in tRPC a failed mutation surfaces a typed TRPCError the client can match.
// => co-03: the error channel from Theme C reappears inside the procedure.
class Conflict {
  // => the typed mutation error: this email is already taken
  readonly tag = "Conflict"; // => matchable by the client
  readonly email: string; // => which email collided
  constructor(email: string) {
    // => plain parameter: strip-safe, assigned explicitly
    this.email = email; // => context stored on the instance
  }
}
type Mutation<T> = { ok: true; value: T } | { ok: false; error: Conflict }; // => success or typed conflict
function signup(emails: string[], email: string): Mutation<string> {
  // => the mutation: creates the account or reports the conflict by tag
  if (emails.includes(email)) {
    // => duplicate: the typed error, not an exception
    return { ok: false, error: new Conflict(email) }; // => Conflict out
  } // => fresh email: fall through
  emails.push(email); // => the write: recorded in the table
  return { ok: true, value: "welcome " + email }; // => success out
}
function main(): void {
  // => entry point; a fresh signup succeeds, a repeat collides
  // => the first signup writes and welcomes
  const emails: string[] = ["ada@example.com"]; // => the tiny account table
  const first: Mutation<string> = signup(emails, "grace@example.com"); // => fresh email
  if (first.ok) {
    // => narrow before reading the welcome
    console.log("first: " + first.value); // => Output: first: welcome grace@example.com
  } // => first done
  // => the same email again collides: the client matches the tag
  const repeat: Mutation<string> = signup(emails, "grace@example.com"); // => duplicate email
  if (!repeat.ok) {
    // => the error branch reads tag and context
    console.log("repeat: " + repeat.error.tag + " " + repeat.error.email); // => Output: repeat: Conflict grace@example.com
  } // => repeat done
}
main(); // => run once; a throw exits nonzero
