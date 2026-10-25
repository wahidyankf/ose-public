// => Example 54: promise chains sequence async steps; each then maps the value.
function fetchUser(): Promise<{ login: string }> {
  // => fixed async source
  return Promise.resolve({ login: "ada" }); // => resolves on the microtask queue
} // => end of function fetchUser(): Promise<{ login: string }>
function fetchScore(login: string): Promise<number> {
  // => second async step
  return Promise.resolve(login.length * 10); // => deterministic derived value
} // => end of function fetchScore(login: string): Promise<number>
async function main(): Promise<void> {
  // => WHY wrapper: no top-level await in commonjs
  const label = await fetchUser() // => step one resolves first
    .then((u) => fetchScore(u.login)) // => WHY chain: each then maps the value onward
    .then((score) => `score: ${score}`); // => final mapping to display text
  console.log(label); // => Output: score: 30
} // => end of async function main(): Promise<void>
void main(); // => floating promise: rejections would fail the run loudly
