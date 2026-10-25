// => Worked Example 27: the in-process caller tests the router with no network.
// => co-07: in tRPC this is createCallerFactory(router)(ctx): the client without HTTP.
// => co-06: the caller shares the router's types, so drift is a compile error.
interface Router {
  // => the app router: procedure names to handlers, in one table
  routes: Record<string, (input: unknown) => unknown>; // => each handler takes unknown, returns unknown
}
function createCaller(
  router: Router, // => the app router under test
): (name: string, input: unknown) => { ok: true; value: unknown } | { ok: false; issue: string } {
  // => the caller factory: binds a router into a direct-call function
  // => Each call looks its procedure up by name.
  return (name: string, input: unknown) => {
    // => each call names its procedure and passes its input
    const handler: ((input: unknown) => unknown) | undefined = router.routes[name]; // => route lookup by name
    if (handler === undefined) {
      // => unknown procedure: the caller reports it like a 404
      return { ok: false, issue: "unknown procedure: " + name }; // => routing error, no network involved
    } // => procedure found: fall through
    return { ok: true, value: handler(input) }; // => handler runs in-process
  };
}
// => The test suite calls two procedures without any HTTP.
function main(): void {
  // => entry point; the test suite calls two procedures without any HTTP
  // => the router under test: one addition procedure
  const caller = createCaller({
    routes: {
      add: (input: unknown) => {
        // => the add handler: reads two numbers from the input
        const pair = input as { a: number; b: number }; // => narrow to the expected input shape
        return pair.a + pair.b; // => the sum
      },
    },
  }); // => router built inline, caller bound to it
  // => a valid call returns the sum through the caller
  const sum = caller("add", { a: 19, b: 23 }); // => in-process call, no socket
  // => The valid call returns the sum through the caller.
  if (sum.ok) {
    // => narrow before reading the value
    console.log("add: " + String(sum.value)); // => Output: add: 42
  } // => sum done
  // => a misspelled procedure name fails at routing, before any handler runs
  const typo = caller("ad", { a: 1, b: 2 }); // => no such procedure
  if (!typo.ok) {
    // => the routing error names the bad procedure
    console.log("typo: " + typo.issue); // => Output: typo: unknown procedure: ad
  } // => typo done
}
main(); // => run once; a throw exits nonzero
