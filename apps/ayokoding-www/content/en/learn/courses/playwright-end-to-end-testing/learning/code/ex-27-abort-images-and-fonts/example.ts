// Example 27: Abort Images and Fonts. (co-05: network-interception)
// => Playwright 1.60.0, docs accessed 2026-10-20; route.abort drops heavy
// => asset requests (images, fonts, media) so layout tests run in a fraction
// => of the time; the page still renders text content the test asserts on:
// =>   real: await page.route("**/*.{png,jpg,woff2}", (route) => route.abort());
interface Asset {
  // => one requested asset
  url: string; // => the asset URL
  bytes: number; // => its size when served
  aborted: boolean; // => true when the route dropped it
} // => Asset tracks what the page paid for

async function main(): Promise<void> {
  // => entry point for the abort check
  const assets: Asset[] = [
    // => what the fixture page asks for
    { url: "/app.js", bytes: 1200, aborted: false }, // => code: always load
    { url: "/hero.png", bytes: 48000, aborted: false }, // => image: abort in layout tests
    { url: "/font.woff2", bytes: 22000, aborted: false }, // => font: abort in layout tests
  ]; // => asset list defined
  const loaded: Asset[] = assets.filter((asset) => !shouldAbort(asset.url)); // => real: route.abort() for images/fonts
  const skipped: Asset[] = assets.filter((asset) => shouldAbort(asset.url)); // => the dropped ones
  for (const asset of skipped) {
    // => mark every aborted asset
    asset.aborted = true; // => dropped: zero bytes transferred
  } // => abort pass ends
  const saved: number = skipped.reduce((sum, asset) => sum + asset.bytes, 0); // => bytes never downloaded
  console.log("loaded: " + loaded.map((asset) => asset.url).join(",")); // => Output: loaded: /app.js
  console.log("aborted: " + String(skipped.length)); // => Output: aborted: 2
  console.log("bytes saved: " + String(saved)); // => Output: bytes saved: 70000
  console.log("page still testable: " + String(loaded.length === 1)); // => Output: page still testable: true
} // => main ends; text and logic load, decoration does not

function shouldAbort(url: string): boolean {
  // => stand-in for the route pattern
  return url.endsWith(".png") || url.endsWith(".woff2"); // => images and fonts are decoration here
} // => shouldAbort names the droppable kinds

await main(); // => run once; a failure throws and exits nonzero
