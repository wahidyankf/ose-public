// Kata 6 solution: the trace records what was really under the pointer --
// a promo overlay -- so the locator is innocent and the layout is guilty.
// (co-06: trace-viewer)
async function main(): Promise<void> {
  // => entry point
  const hit = "promo-overlay"; // => the trace: what the click really hit
  const aimed = "pay-button"; // => what the locator resolved
  console.log("aimed: " + aimed); // => Output: aimed: pay-button
  console.log("hit: " + hit); // => Output: hit: promo-overlay
  console.log("locator innocent: " + String(hit !== aimed)); // => Output: locator innocent: true
  console.log("fix the overlay: " + String(hit === "promo-overlay")); // => Output: fix the overlay: true
} // => the trace convicted the overlay

await main(); // => run once
