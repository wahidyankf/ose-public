// Kata 8 starter: the screenshot gate compares raw renders, so the clock in
// the header fails the test every minute. The team mutes the gate instead of
// fixing the comparison -- and now real regressions pass silently too.
// Task: mask the dynamic region but keep the gate strict (see Example 56).
// The clock must stop deciding, and genuine drift must still fail.
async function main(): Promise<void> {
  const first = "orders 10:41 milk"; // render at 10:41
  const second = "orders 10:42 milk"; // render at 10:42
  const muted = true; // the gate got muted instead of fixed
  console.log("unmasked equal: " + String(first === second));
  console.log("gate muted: " + String(muted));
  console.log("drift would pass silently: " + String(muted));
}

await main();
