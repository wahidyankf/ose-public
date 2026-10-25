// => Example 60: microtasks drain before the next macrotask; the order is fixed.
async function main(): Promise<void> {
  // => WHY wrapper: no top-level await in commonjs
  const order: string[] = []; // => observed completion order
  const tick = new Promise<void>((resolve) => {
    // => macrotask wrapped for awaiting
    setTimeout(() => {
      order.push("timeout");
      resolve();
    }, 0); // => runs after every microtask
  }); // => end of const tick = new Promise<void>((resolve) =>
  queueMicrotask(() => {
    order.push("microtask");
  }); // => explicit microtask, queued first
  await Promise.resolve().then(() => {
    order.push("promise");
  }); // => promise microtask, queued second
  order.push("after-await"); // => continuation runs third, still inside the microtask drain
  await tick; // => wait for the macrotask last
  console.log(order.join(" ")); // => Output: microtask promise after-await timeout
} // => end of async function main(): Promise<void>
void main(); // => floating promise: rejections would fail the run loudly
