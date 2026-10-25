// => Kata 4 solution: rename joins the router; getName is untouched.
// => Old clients keep compiling and passing; the new procedure is additive only.
// => The test caller is unchanged from the starter: routing by name, errors for gaps.
function createCaller(
  routes: Record<string, (input: unknown) => unknown>,
): (name: string, input: unknown) => { ok: true; value: unknown } | { ok: false; issue: string } {
  // => the test caller: identical to the starter, routes by name
  return (name: string, input: unknown) => {
    // => each call looks its procedure up by name
    const handler: ((input: unknown) => unknown) | undefined = routes[name]; // => route lookup
    if (handler === undefined) {
      // => missing procedure: the routing error
      return { ok: false, issue: "unknown procedure: " + name }; // => still possible for typos
    } // => procedure found: fall through
    return { ok: true, value: handler(input) }; // => handler runs in-process
  };
}
// => The new procedure's gate: non-empty strings in, named rejections out.
function checkName(input: unknown): { ok: true; name: string } | { ok: false; issue: string } {
  // => the new procedure's input gate: non-empty strings only
  if (typeof input !== "string" || input.length === 0) {
    // => blank renames are rejected at the schema
    return { ok: false, issue: "name: expected non-empty string" }; // => gate error
  } // => valid name: fall through
  return { ok: true, name: input }; // => trusted name out
}
// => Version two of the router: getName verbatim plus the new rename procedure.
function main(): void {
  // => entry point; both procedures route, the old one unchanged
  // => the v2 router: getName verbatim plus the new rename procedure
  const caller = createCaller({
    // => getName copied untouched from v1
    getName: () => "Ada", // => old procedure, old behavior
    rename: (input: unknown) => {
      // => new procedure: schema gate then the rename
      const checked = checkName(input); // => gate runs first
      return checked.ok ? "renamed to " + checked.name : "rejected: " + checked.issue; // => gate decides
    },
  });
  // => the old client call still passes with the old answer
  const old = caller("getName", null); // => existing client call
  // => The old client call still passes with the old answer.
  if (old.ok) {
    // => unchanged behavior is the point
    console.log("solution: getName=" + String(old.value)); // => old path still green
  } // => old done
  // => the new client call now routes and renames
  const renamed = caller("rename", "Grace"); // => new client call, new procedure
  if (renamed.ok) {
    // => narrow before reading the answer
    console.log("solution: " + String(renamed.value)); // => fixed: new procedure live
  } // => renamed done
}
main(); // => run once; a throw exits nonzero
