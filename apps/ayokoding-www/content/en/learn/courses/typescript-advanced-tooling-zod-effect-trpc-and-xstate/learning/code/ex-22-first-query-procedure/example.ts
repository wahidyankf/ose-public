// => Worked Example 22: a procedure is a named, typed remote function.
// => co-07: in tRPC this is t.procedure.query(() => ...): the unit of a typed call.
interface Procedure<I, O> {
  // => one procedure: its name, its input check, and its handler
  name: string; // => the route key the caller addresses
  checkInput: (input: unknown) => { ok: true; value: I } | { ok: false; issue: string }; // => input gate
  handle: (input: I) => O; // => the implementation, typed by the gate
}
// => The procedure builder: name plus handler, the tRPC shape.
function defineProcedure<I, O>(
  name: string, // => the route key the caller addresses
  checkInput: (input: unknown) => { ok: true; value: I } | { ok: false; issue: string }, // => the input gate for this procedure
  handle: (input: I) => O, // => the implementation, typed by the gate
): Procedure<I, O> {
  // => registration record out
  // => the procedure builder: t.procedure shape, name plus handler
  return { name: name, checkInput: checkInput, handle: handle }; // => registration record
}
// => The in-process caller: the same gate the network caller passes through.
function call<I, O>(proc: Procedure<I, O>, input: unknown): { ok: true; value: O } | { ok: false; issue: string } {
  // => the in-process caller: same gate the network caller would pass through
  const checked = proc.checkInput(input); // => input gate runs first
  if (!checked.ok) {
    // => bad input never reaches the handler
    return { ok: false, issue: checked.issue }; // => gate error out
  } // => input valid: fall through
  return { ok: true, value: proc.handle(checked.value) }; // => handler result out
}
// => One procedure called twice: the route travels with each call.
function main(): void {
  // => entry point; a greeting procedure called twice, once well and once badly
  // => the hello procedure takes no meaningful input and returns a greeting
  const hello: Procedure<null, string> = defineProcedure(
    "hello", // => the route key for this procedure
    (input: unknown) => {
      // => void input gate: anything passes, nothing is read
      void input; // => input deliberately unused
      return { ok: true, value: null }; // => unit value in
    },
    () => "hello from the server", // => the handler ignores input, returns greeting
  ); // => handler ignores input, returns greeting
  const good = call(hello, null); // => well-formed call
  if (good.ok) {
    // => narrow before reading the value
    console.log("hello: " + good.value); // => Output: hello: hello from the server
  } // => good done
  // => the procedure name travels with every call: routing starts here
  console.log("route: " + hello.name + " called"); // => Output: route: hello called
}
main(); // => run once; a throw exits nonzero
