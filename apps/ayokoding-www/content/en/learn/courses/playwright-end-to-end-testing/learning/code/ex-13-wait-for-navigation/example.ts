// Example 13: Waiting for Navigation. (co-02: auto-waiting)
// => Playwright 1.60.0, docs accessed 2026-10-20; clicks that navigate
// => resolve only after the new page loads: waitForURL (or the promise pair
// => Promise.all([page.waitForNavigation(), button.click()])) avoids racing
// => the assertion against the old page:
// =>   real: await page.getByRole("link", { name: "Orders" }).click();
async function main(): Promise<void> {
  // => entry point for the navigation wait
  const history: string[] = ["/cart", "/cart", "/orders"]; // => the URL per tick: still cart, then orders
  const landed: string = waitForUrl(history, "/orders", 5); // => real: await page.waitForURL("/orders")
  console.log("landed on: " + landed); // => Output: landed on: /orders
  console.log("landed at tick: " + String(history.indexOf(landed))); // => Output: landed at tick: 2
  const raced: string = history[0] as string; // => asserting immediately still sees the cart
  console.log("immediate sees: " + raced); // => Output: immediate sees: /cart
  console.log("wait was needed: " + String(raced !== landed)); // => Output: wait was needed: true
} // => main ends; waiting saw the new page

function waitForUrl(history: string[], wanted: string, timeout: number): string {
  // => stand-in for page.waitForURL
  for (let tick = 0; tick <= timeout && tick < history.length; tick++) {
    // => poll the URL every tick
    if (history[tick] === wanted) {
      // => the wanted page is showing
      return history[tick] as string; // => resolve with the new URL
    } // => still the old page
  } // => timeout exhausted
  throw new Error("waitForURL timed out waiting for " + wanted); // => real Playwright lists the final URL
} // => waitForUrl resolves on the new page

await main(); // => run once; a failure throws and exits nonzero
