// Kata 1 starter: the test sleeps a fixed 10 ticks, then asserts. It passes,
// but every run pays the full sleep even though the toast renders at tick 3.
// Task: replace the fixed sleep with a condition wait (see Example 10). The
// test must still pass and must finish earlier than tick 10.
async function main(): Promise<void> {
  const slept = 10; // fixed sleep: the whole budget, every run
  const toastAt = 3; // the toast actually renders at tick 3
  const pass: boolean = slept >= toastAt; // passes, but paid 10 for 3
  console.log("passes: " + String(pass));
  console.log("cost ticks: " + String(slept));
  console.log("wasted: " + String(slept - toastAt));
}

await main();
