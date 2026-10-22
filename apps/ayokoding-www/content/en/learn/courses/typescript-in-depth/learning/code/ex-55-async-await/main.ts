// => Example 55: await flattens nested thens; the order of lines is the order of work.
function getLogin(): Promise<string> {
  // => fixed async source
  return Promise.resolve("grace"); // => resolves on the microtask queue
} // => end of function getLogin(): Promise<string>
function getAccess(login: string): Promise<string> {
  // => second async step
  return Promise.resolve(login === "grace" ? "admin" : "guest"); // => deterministic mapping
} // => end of function getAccess(login: string): Promise<string>
async function main(): Promise<void> {
  // => sequential awaits read top to bottom
  const login = await getLogin(); // => suspension point one
  const access = await getAccess(login); // => suspension point two, uses step one
  console.log(login, access); // => Output: grace admin
} // => end of async function main(): Promise<void>
void main(); // => floating promise: rejections would fail the run loudly
