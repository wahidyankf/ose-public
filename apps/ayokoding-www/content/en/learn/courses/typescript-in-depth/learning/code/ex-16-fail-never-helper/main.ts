// => Example 16: a never-returning fail() marks impossible branches and feeds ??.
function fail(message: string): never {
  // => WHY never: callers know it cannot return
  throw new Error(message); // => always throws, never produces a value
} // => end of function fail(message: string): never
const port: number | undefined = 3101; // => optional config, present here
const live = port ?? fail("port is required"); // => WHY ??: absence throws at the boundary
console.log(live); // => Output: 3101
function area(kind: "a" | "b"): number {
  // => closed input pair
  if (kind === "a") {
    // => first arm handled
    return 1; // => plain value out
  } // => end of if (kind === "a")
  if (kind === "b") {
    // => second arm handled
    return 2; // => plain value out
  } // => end of if (kind === "b")
  return fail(`impossible kind: ${kind}`); // => WHY never: return typechecks, throws if reached
} // => end of function area(kind: "a" | "b"): number
console.log(area("b")); // => Output: 2
