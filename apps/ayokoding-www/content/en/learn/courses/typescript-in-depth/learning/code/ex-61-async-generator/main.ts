// => Example 61: async generators stream pages; for-await consumes them in order.
async function* pages(total: number): AsyncGenerator<string> {
  // => WHY async generator: paged stream
  for (let p = 1; p <= total; p++) {
    // => fixed page list
    yield `page-${p}`; // => one page per resumption
  } // => end of for (let p = 1; p <= total; p++)
} // => end of async function* pages(total: number): AsyncGenerator
async function main(): Promise<void> {
  // => WHY wrapper: no top-level await in commonjs
  const seen: string[] = []; // => consumed pages
  for await (const page of pages(3)) {
    // => WHY for-await: backpressure-friendly consumption
    seen.push(page); // => pages arrive in order
  } // => end of for await (const page of pages(3))
  console.log(seen.join(" ")); // => Output: page-1 page-2 page-3
} // => end of async function main(): Promise<void>
void main(); // => floating promise: rejections would fail the run loudly
