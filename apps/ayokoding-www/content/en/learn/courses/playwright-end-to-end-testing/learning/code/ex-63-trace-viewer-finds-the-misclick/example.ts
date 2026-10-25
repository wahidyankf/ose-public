// Example 63: Trace Viewer Finds the Misclick. (co-06: trace-viewer)
// => Playwright 1.60.0, docs accessed 2026-10-20; the trace shows the click
// => landing on the wrong element (an overlay covered the button), so the
// => fix targets the overlay instead of the locator; without the trace the
// => same failure reads as "button not clickable":
// =>   real: npx playwright show-trace trace.zip (step to the click, inspect the snapshot)
interface Click {
  // => one recorded click with its target
  x: number; // => the click x coordinate
  y: number; // => the click y coordinate
  hit: string; // => what was actually under the pointer
} // => Click records where the pointer landed, not where it aimed

async function main(): Promise<void> {
  // => entry point for the misclick check
  const click: Click = { x: 210, y: 96, hit: "promo-overlay" }; // => the trace shows an overlay took the hit
  console.log("aimed at pay: " + String(click.x === 210 && click.y === 96)); // => Output: aimed at pay: true
  console.log("hit overlay: " + String(click.hit)); // => Output: hit overlay: promo-overlay
  console.log("locator innocent: " + String(click.hit !== "pay-button")); // => Output: locator innocent: true
  console.log("fix the overlay: " + String(click.hit === "promo-overlay")); // => Output: fix the overlay: true
} // => main ends; the trace convicted the overlay

await main(); // => run once; a failure throws and exits nonzero
