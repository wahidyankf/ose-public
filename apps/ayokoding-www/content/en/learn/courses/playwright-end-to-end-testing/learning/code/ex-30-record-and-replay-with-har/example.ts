// Example 30: Record and Replay With HAR. (co-05: network-interception)
// => Playwright 1.60.0, docs accessed 2026-10-20; record: "record" mode
// => stores real traffic into a .har file once, then "replay" serves every
// => later run from the archive -- deterministic, offline, and fast. Update
// => the archive only when the API genuinely changes:
// =>   real: npx playwright test --config=replay.config.ts (har: "cart.har")
interface Entry {
  // => one archived exchange
  url: string; // => the request URL
  body: string; // => the recorded response bytes
} // => Entry is one line of the archive

async function main(): Promise<void> {
  // => entry point for the replay check
  const archive: Entry[] = [
    // => the committed .har equivalent: two calls
    { url: "/api/cart", body: '{"total":"$42.00"}' }, // => recorded once against the real backend
    { url: "/api/user", body: '{"name":"ada"}' }, // => recorded in the same session
  ]; // => archive fixed; later runs never touch the network
  const cart: string = replay(archive, "/api/cart"); // => served from the archive
  const user: string = replay(archive, "/api/user"); // => served from the archive
  console.log("cart: " + cart); // => Output: cart: {"total":"$42.00"}
  console.log("user: " + user); // => Output: user: {"name":"ada"}
  console.log("offline: " + String(cart.includes("42") && user.includes("ada"))); // => Output: offline: true
  try {
    // => unknown URLs stay unknown: the archive never invents data
    replay(archive, "/api/admin"); // => not recorded, must fail loudly
    console.log("unrecorded served: false"); // => unreachable when replay throws
  } catch {
    // => the archive refuses to answer
    console.log("unrecorded refused: true"); // => Output: unrecorded refused: true
  } // => strict replay ends
} // => main ends; the archive served everything recorded

function replay(archive: Entry[], url: string): string {
  // => stand-in for HAR replay mode
  const hit: Entry | undefined = archive.find((entry) => entry.url === url); // => exact URL match, like HAR replay
  if (hit === undefined) {
    // => nothing recorded for this URL
    throw new Error("no HAR entry for " + url); // => fail instead of hitting the network
  } // => recorded branch below
  return hit.body; // => serve the recorded bytes verbatim
} // => replay answers only from the archive

await main(); // => run once; a failure throws and exits nonzero
