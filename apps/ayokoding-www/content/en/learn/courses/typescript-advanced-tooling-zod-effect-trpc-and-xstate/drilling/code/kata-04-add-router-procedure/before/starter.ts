// => Kata 4 starter: the client calls a procedure the router does not have.
// => Task: add the rename procedure to the router without touching the old one.
function createCaller(
  routes: Record<string, (input: unknown) => unknown>,
): (name: string, input: unknown) => { ok: true; value: unknown } | { ok: false; issue: string } {
  // => the test caller: routes by name, reports unknown procedures
  return (name: string, input: unknown) => {
    // => each call looks its procedure up by name
    const handler: ((input: unknown) => unknown) | undefined = routes[name]; // => route lookup
    if (handler === undefined) {
      // => missing procedure: the routing error
      return { ok: false, issue: "unknown procedure: " + name }; // => client ahead of server
    } // => procedure found: fall through
    return { ok: true, value: handler(input) }; // => handler runs in-process
  };
}
// => The old procedure works; the new call exposes the gap.
function main(): void {
  // => entry point; the old procedure works, the new one is missing
  // => the router has getName only: rename is not there yet
  const caller = createCaller({ getName: () => "Ada" }); // => v1 router
  const old = caller("getName", null); // => existing client call
  // => The existing path stays green while rename is missing.
  if (old.ok) {
    // => the old procedure keeps working
    console.log("starter: getName=" + String(old.value)); // => old path green
  } // => old done
  // => the new client call fails routing: the procedure does not exist yet
  const missing = caller("rename", "Grace"); // => new client call, no server procedure
  if (!missing.ok) {
    // => the routing error proves the gap
    console.log("starter: " + missing.issue); // => starter prints the gap: the task
  } // => missing done
}
main(); // => run once; a throw exits nonzero
