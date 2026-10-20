// Example 56: Mask Dynamic Regions. (co-07: visual-comparison)
// => Playwright 1.60.0, docs accessed 2026-10-20; clocks, avatars, and ads
// => change every run, so mask: [locator] covers them before comparing;
// => masking asserts layout stability without freezing time:
// =>   real: await expect(page).toHaveScreenshot({ mask: [page.getByTestId("clock")] });
async function main(): Promise<void> {
  // => entry point for the mask check
  const first: string = maskClock("orders 10:41 milk"); // => clock reads 10:41
  const second: string = maskClock("orders 10:42 milk"); // => a minute later, same order
  console.log("masked first: " + first); // => Output: masked first: orders [time] milk
  console.log("masked equal: " + String(first === second)); // => Output: masked equal: true
  const unmasked: boolean = "orders 10:41 milk" === "orders 10:42 milk"; // => without the mask, time always differs
  console.log("unmasked differs: " + String(!unmasked)); // => Output: unmasked differs: true
  console.log("mask stabilizes: " + String(first === second && !unmasked)); // => Output: mask stabilizes: true
} // => main ends; the clock no longer decides the verdict

function maskClock(render: string): string {
  // => stand-in for the mask locator
  return render.replace(/[0-9]{1,2}:[0-9]{2}/g, "[time]"); // => every clock reading becomes one token
} // => maskClock covers the dynamic region

await main(); // => run once; a failure throws and exits nonzero
