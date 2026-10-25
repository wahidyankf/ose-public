// => Worked Example 11: a function that states what it can fail with.
// => co-03: in Effect this is Effect<string, UserNotFound>: success and error both typed.
class UserNotFound {
  // => a typed error: data with a tag, not a thrown string
  readonly tag = "UserNotFound"; // => the tag catchTag matches on later
  readonly userId: string; // => the error carries its context
  constructor(userId: string) {
    // => plain parameter: strip-safe, assigned explicitly
    this.userId = userId; // => context stored on the instance
  }
}
type Outcome<A, E> = { ok: true; value: A } | { ok: false; error: E }; // => the Effect shape: value or typed error
function findUser(users: Record<string, string>, id: string): Outcome<string, UserNotFound> {
  // => the signature advertises its failure: missing users are expected, not exceptional
  const found: string | undefined = users[id]; // => lookup may miss: the honest type says so
  if (found === undefined) {
    // => the miss becomes a typed error value, never a throw
    return { ok: false, error: new UserNotFound(id) }; // => error as data, tag attached
  } // => found: fall through
  return { ok: true, value: found }; // => success carries the name
}
function main(): void {
  // => entry point; one hit and one miss against the same table
  // => a present user returns its name with no error in sight
  const users: Record<string, string> = { u1: "Ada" }; // => the tiny user table
  const hit: Outcome<string, UserNotFound> = findUser(users, "u1"); // => lookup that succeeds
  if (hit.ok) {
    // => narrow the union before reading the value
    console.log("hit: " + hit.value); // => Output: hit: Ada
  } // => hit done
  // => a missing user returns a tagged error the caller must handle
  const miss: Outcome<string, UserNotFound> = findUser(users, "u9"); // => lookup that fails
  if (!miss.ok) {
    // => the error branch reads the tag and the context
    console.log("miss: " + miss.error.tag + " id=" + miss.error.userId); // => Output: miss: UserNotFound id=u9
  } // => miss done
}
main(); // => run once; a throw exits nonzero
