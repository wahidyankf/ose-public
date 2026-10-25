// => Worked Example 28: the client reads the router's types, not a copy of them.
// => co-06: in tRPC this is inferRouterInputs<typeof router>: the client's types derive from the server.
interface SignupInput {
  // => declared once on the server: the procedure's input shape
  email: string; // => the client must supply exactly this
}
interface SignupOutput {
  // => declared once on the server: the procedure's output shape
  id: string; // => the client may rely on exactly this
}
interface AppRouter {
  // => the router type: the single source of truth both sides share
  signup: (input: SignupInput) => SignupOutput; // => input in, output out, one declaration
}
type RouterInput<T> = T extends { signup: (input: infer I) => unknown } ? I : never; // => inferRouterInputs shape: extract the input
type RouterOutput<T> = T extends { signup: (input: never) => infer O } ? O : never; // => inferRouterOutputs shape: extract the output
function main(): void {
  // => entry point; the client types come from the router type, never from duplication
  // => the server implements the router exactly once
  const router: AppRouter = { signup: (input: SignupInput) => ({ id: "usr_" + input.email }) }; // => server implementation
  // => the client derives its types from the router: no second declaration anywhere
  type ClientInput = RouterInput<AppRouter>; // => resolves to SignupInput
  type ClientOutput = RouterOutput<AppRouter>; // => resolves to SignupOutput
  const input: ClientInput = { email: "ada@example.com" }; // => client builds the derived input
  const output: ClientOutput = router.signup(input); // => client calls through the shared type
  console.log("client: id=" + output.id); // => Output: client: id=usr_ada@example.com
  // => the derivation is visible in the types: same shape, zero copies
  const sameShape: SignupInput = input; // => compiles only because ClientInput is SignupInput
  console.log("shared: email=" + sameShape.email); // => Output: shared: email=ada@example.com
}
main(); // => run once; a throw exits nonzero
