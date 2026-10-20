// Kata 6 starter: the test failed with "button not clickable" and the first
// instinct was to blame the locator. The locator is fine -- but nothing in
// this file looks at the trace, so the wrong fix is one edit away.
// Task: read the trace and name the real culprit (see Example 63). The
// diagnosis must point at the overlay, not the locator.
async function main(): Promise<void> {
  const error = "button not clickable"; // the failure text
  const diagnosis = "locator broken"; // the hasty (wrong) conclusion
  console.log("error: " + error);
  console.log("diagnosis: " + diagnosis);
  console.log("trace consulted: false");
}

await main();
