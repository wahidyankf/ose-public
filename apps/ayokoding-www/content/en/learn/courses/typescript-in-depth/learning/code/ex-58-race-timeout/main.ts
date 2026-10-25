// => Example 58: race picks the first settler; a ready fallback beats slow work.
function slow(): Promise<string> {
  // => a task that never settles in this demo
  return new Promise<string>(() => undefined); // => pending forever, stands in for slow I/O
} // => end of function slow(): Promise<string>
async function main(): Promise<void> {
  // => WHY wrapper: no top-level await in commonjs
  const winner = await Promise.race([slow(), Promise.resolve("cache")]); // => WHY race: first settler wins
  console.log("winner:", winner); // => Output: winner: cache
  try {
    // => rejection can win the race too
    await Promise.race([slow(), Promise.reject(new Error("budget spent"))]); // => fallback rejects fast
  } catch (err) {
    // => report the winning rejection
    console.log("lost:", err instanceof Error ? err.message : err); // => Output: lost: budget spent
  } // => end of catch (err)
} // => end of async function main(): Promise<void>
void main(); // => floating promise: rejections would fail the run loudly
