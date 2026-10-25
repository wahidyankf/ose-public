// => Worked Example 33: procedure errors arrive typed, so the client matches on kind.
// => co-06: the error type travels with the procedure type: no status-code guessing.
// => co-03: the same tagged-error discipline as Theme C, now across the wire.
type ProcError = { kind: "NotFound"; id: string } | { kind: "Forbidden"; id: string }; // => the procedure's error union, shared with the client
type ProcResult = { ok: true; name: string } | { ok: false; error: ProcError }; // => the full procedure contract
function getUser(ids: string[], viewer: string, id: string): ProcResult {
  // => the procedure: success or one of the two typed errors, never a throw
  if (!ids.includes(id)) {
    // => absent user: first union member
    return { ok: false, error: { kind: "NotFound", id: id } }; // => tagged NotFound
  } // => exists: fall through to permission
  if (viewer !== "admin" && id === "root") {
    // => restricted user: second union member
    return { ok: false, error: { kind: "Forbidden", id: id } }; // => tagged Forbidden
  } // => allowed: fall through
  return { ok: true, name: "user:" + id }; // => success
}
function clientMessage(result: ProcResult): string {
  // => the client: matches on kind, with a branch for every union member
  if (result.ok) {
    // => success branch
    return "hello " + result.name; // => render the user
  } // => error: narrow the union by kind
  if (result.error.kind === "NotFound") {
    // => absence branch: offer to create
    return "missing " + result.error.id + ": create it?"; // => recovery UX for absence
  } // => only Forbidden remains
  return "denied " + result.error.id + ": ask an admin"; // => recovery UX for denial
}
function main(): void {
  // => entry point; the client renders all three outcomes from the typed contract
  // => a normal read renders the greeting
  console.log(clientMessage(getUser(["ada", "root"], "guest", "ada"))); // => Output: hello user:ada
  // => a missing user renders the creation prompt
  console.log(clientMessage(getUser(["ada", "root"], "guest", "ghost"))); // => Output: missing ghost: create it?
  // => a restricted user renders the escalation prompt
  console.log(clientMessage(getUser(["ada", "root"], "guest", "root"))); // => Output: denied root: ask an admin
}
main(); // => run once; a throw exits nonzero
