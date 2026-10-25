// Kata 8 solution: mask the clock, keep everything else exact. Time stops
// deciding the verdict, but a changed total still goes red.
// (co-07: visual-comparison)
async function main(): Promise<void> {
  // => entry point
  const masked = (render: string): string => render.replace(/[0-9]{1,2}:[0-9]{2}/g, "[time]"); // => the clock mask
  const ten41: string = masked("orders 10:41 milk $3.00"); // => render at 10:41
  const ten42: string = masked("orders 10:42 milk $3.00"); // => render at 10:42
  console.log("clock ignored: " + String(ten41 === ten42)); // => Output: clock ignored: true
  const drift: string = masked("orders 10:42 milk $2.40"); // => a genuine price change
  console.log("drift still red: " + String(ten41 !== drift)); // => Output: drift still red: true
  console.log("gate strict where it matters: " + String(ten41 === ten42 && ten41 !== drift)); // => Output: gate strict where it matters: true
} // => masked time, exact everything else

await main(); // => run once
