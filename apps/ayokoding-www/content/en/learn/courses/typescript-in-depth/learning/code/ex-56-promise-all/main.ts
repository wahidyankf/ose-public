// => Example 56: Promise.all runs steps together and keeps result order.
function step(id: string, value: number): Promise<string> {
  // => fixed async step
  return Promise.resolve(`${id}=${value}`); // => resolves on the microtask queue
} // => end of function step(id: string, value: number): Promise<st
async function main(): Promise<void> {
  // => WHY wrapper: no top-level await in commonjs
  const out = await Promise.all([step("b", 2), step("a", 1), step("c", 3)]); // => WHY all: together, ordered
  console.log(out.join(" ")); // => Output: b=2 a=1 c=3, input order kept
} // => end of async function main(): Promise<void>
void main(); // => floating promise: rejections would fail the run loudly
