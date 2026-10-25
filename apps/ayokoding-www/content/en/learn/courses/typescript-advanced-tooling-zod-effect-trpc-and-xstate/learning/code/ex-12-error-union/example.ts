// => Worked Example 12: an error union lists every failure mode up front.
// => co-03: in Effect this is Effect<User, NotFound | Forbidden>: callers see both.
class NotFound {
  // => first failure mode: the thing does not exist
  readonly tag = "NotFound"; // => matched by name in catchTag
  readonly id: string; // => which id was missing
  constructor(id: string) {
    // => plain parameter: strip-safe, assigned explicitly
    this.id = id; // => context stored on the instance
  }
}
class Forbidden {
  // => second failure mode: the thing exists but is off-limits
  readonly tag = "Forbidden"; // => matched by name in catchTag
  readonly id: string; // => which id was denied
  constructor(id: string) {
    // => plain parameter: strip-safe, assigned explicitly
    this.id = id; // => context stored on the instance
  }
}
type Outcome<A, E> = { ok: true; value: A } | { ok: false; error: E }; // => value or one of the listed errors
// => The union in the signature is the menu: two members, two recoveries, no surprises.
function readDoc(ids: string[], viewer: string, id: string): Outcome<string, NotFound | Forbidden> {
  // => the union in the signature is the complete failure menu
  if (!ids.includes(id)) {
    // => absent document: first failure mode
    return { ok: false, error: new NotFound(id) }; // => tagged NotFound
  } // => exists: fall through to the permission check
  if (viewer !== "admin" && id === "secret") {
    // => present but restricted: second failure mode
    return { ok: false, error: new Forbidden(id) }; // => tagged Forbidden
  } // => allowed: fall through
  return { ok: true, value: "doc:" + id }; // => success carries the document
}
function main(): void {
  // => entry point; three calls hit all three outcomes
  // => success, denial, and absence each print once: full coverage of the union.
  // => an admin reading a normal doc succeeds
  const ids: string[] = ["memo", "secret"]; // => the document table
  const ok: Outcome<string, NotFound | Forbidden> = readDoc(ids, "admin", "memo"); // => allowed read
  if (ok.ok) {
    // => narrow before reading the value
    console.log("read: " + ok.value); // => Output: read: doc:memo
  } // => read done
  // => a guest reading the secret doc fails with the permission error
  const denied: Outcome<string, NotFound | Forbidden> = readDoc(ids, "guest", "secret"); // => denied read
  if (!denied.ok) {
    // => the union narrows to the two error classes
    const error: NotFound | Forbidden = denied.error; // => name the union for the tag read
    console.log("denied: " + error.tag + " id=" + error.id); // => Output: denied: Forbidden id=secret
  } // => denied done
  // => anyone reading a missing doc fails with the absence error
  const missing: Outcome<string, NotFound | Forbidden> = readDoc(ids, "admin", "lost"); // => absent read
  if (!missing.ok) {
    // => the other union member surfaces here
    const error: NotFound | Forbidden = missing.error; // => same union, other tag
    console.log("missing: " + error.tag + " id=" + error.id); // => Output: missing: NotFound id=lost
  } // => missing done
}
main(); // => run once; a throw exits nonzero
