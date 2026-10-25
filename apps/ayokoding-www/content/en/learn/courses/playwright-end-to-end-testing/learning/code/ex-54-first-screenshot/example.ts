// Example 54: First Screenshot. (co-07: visual-comparison)
// => Playwright 1.60.0, docs accessed 2026-10-20; expect(page).toHaveScreenshot
// => compares the rendered page against a committed baseline pixel by pixel;
// => the first run writes the baseline, later runs must reproduce it byte
// => for byte:
// =>   real: await expect(page).toHaveScreenshot("orders.png");
async function main(): Promise<void> {
  // => entry point for the screenshot check
  const render: string = renderPage("orders", ["milk", "bread"]); // => the current render, canonical text form
  const baseline = "orders|milk,bread"; // => the committed baseline bytes
  console.log("render: " + render); // => Output: render: orders|milk,bread
  console.log("matches baseline: " + String(render === baseline)); // => Output: matches baseline: true
  const changed: string = renderPage("orders", ["milk", "eggs"]); // => a product changed
  console.log("change detected: " + String(changed !== baseline)); // => Output: change detected: true
  console.log("pixel gate holds: " + String(render === baseline && changed !== baseline)); // => Output: pixel gate holds: true
} // => main ends; identical renders pass, any drift fails

function renderPage(page: string, items: string[]): string {
  // => stand-in for the screenshot bytes
  return page + "|" + items.join(","); // => canonical render: name plus items in order
} // => renderPage canonicalizes the page into comparable bytes

await main(); // => run once; a failure throws and exits nonzero
