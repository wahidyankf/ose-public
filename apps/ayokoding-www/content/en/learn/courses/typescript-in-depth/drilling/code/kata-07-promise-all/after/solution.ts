// => Kata 7 solution: Promise.all starts every fetch before awaiting any.
function loadAll(ids: string[]): Promise<string[]> {
  // => concurrent fan-out
  return Promise.all(ids.map((id) => Promise.resolve(`row:${id}`))); // => WHY all: together, ordered
} // => end of function loadAll(ids: string[]): Promise<string[]>
async function main(): Promise<void> {
  // => WHY wrapper: no top-level await in commonjs
  console.log((await loadAll(["a", "b", "c"])).join(" ")); // => Output: row:a row:b row:c
} // => end of async function main(): Promise<void>
void main(); // => floating promise: rejections would fail the run loudly
