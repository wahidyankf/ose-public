// => Worked Example 26: middleware builds context; procedures read it.
// => co-07: in tRPC this is t.middleware: auth runs before the handler, context carries the user.
// => co-05: context is dependency injection for procedures: same pattern as Theme D's layers.
interface Context {
  // => the request context: what middleware proved about the caller
  user: string | null; // => null means anonymous: middleware could not authenticate
  role: string; // => the caller's role when authenticated
}
function authMiddleware(token: unknown): Context {
  // => the auth step: a valid token becomes a user, anything else stays anonymous
  if (token === "token-admin") {
    // => the one valid token in this tiny model
    return { user: "Ada", role: "admin" }; // => authenticated context
  } // => any other token: fall through to anonymous
  return { user: null, role: "guest" }; // => anonymous context
}
function adminStats(context: Context): { ok: true; report: string } | { ok: false; issue: string } {
  // => a protected procedure: reads context, never the raw token
  if (context.user === null || context.role !== "admin") {
    // => anonymous or non-admin: refused before any data is touched
    return { ok: false, issue: "forbidden: admin only" }; // => typed refusal
  } // => admin confirmed: fall through
  return { ok: true, report: "stats for " + context.user }; // => handler trusts the context
}
function main(): void {
  // => entry point; an admin token passes, a missing token stops at the procedure
  // => the admin token authenticates and the protected procedure runs
  const admin: Context = authMiddleware("token-admin"); // => valid token through middleware
  const served = adminStats(admin); // => context into the procedure
  if (served.ok) {
    // => narrow before reading the report
    console.log("admin: " + served.report); // => Output: admin: stats for Ada
  } // => admin done
  // => no token means anonymous context, and the procedure refuses it
  const guest: Context = authMiddleware(null); // => missing token through middleware
  const refused = adminStats(guest); // => anonymous context into the procedure
  if (!refused.ok) {
    // => the refusal names the required role
    console.log("guest: " + refused.issue); // => Output: guest: forbidden: admin only
  } // => guest done
}
main(); // => run once; a throw exits nonzero
