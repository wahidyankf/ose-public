// Example 1: First Playwright Script. (co-01: locator)
// => Playwright 1.60.0, docs accessed 2026-10-20; behavior re-verified there.
// => Harness simplification, stated once: no real browser runs here, so this
// => script models page.goto + page.title over a loopback fixture server
// => instead of launching Chromium. The real call it stands in for is:
// =>   real: await page.goto("/"); await expect(page).toHaveTitle(/Acme/);
import http from "node:http"; // => node:http serves the fixture with no network
import { readFile } from "node:fs/promises"; // => readFile loads fixture.html

async function main(): Promise<void> {
  // => entry point; keeps await off the top level
  const html: string = await readFile(new URL("./fixture.html", import.meta.url), "utf-8"); // => the committed page under test
  const server = http.createServer((_req, res) => {
    // => one-route fixture server
    res.writeHead(200, { "content-type": "text/html" }); // => every path serves the page
    res.end(html); // => the body is the fixture bytes
  }); // => server defined; not yet listening
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve)); // => port 0 picks a free loopback port
  const address = server.address(); // => the bound address object
  const port: number = typeof address === "object" && address !== null ? address.port : 0; // => the chosen port number
  const response = await fetch("http://127.0.0.1:" + String(port) + "/"); // => real: await page.goto("/")
  const body: string = await response.text(); // => the rendered bytes
  console.log("status: " + String(response.status)); // => Output: status: 200
  console.log("title: " + matchTitle(body)); // => Output: title: Acme Store
  console.log("heading: " + matchHeading(body)); // => Output: heading: Acme Store
  console.log("goto ok: " + String(response.status === 200 && body.includes("Acme"))); // => Output: goto ok: true
  server.close(); // => stop the fixture server
} // => main ends; the process exits 0 when every line prints

function matchTitle(html: string): string {
  // => tiny stand-in for page.title()
  const found = html.match(/<title>(.*?)<\/title>/); // => the first title element wins
  return found !== null && found[1] !== undefined ? found[1] : ""; // => "" when no title tag exists
} // => matchTitle returns the title text

function matchHeading(html: string): string {
  // => tiny stand-in for locator("h1")
  const found = html.match(/<h1>(.*?)<\/h1>/); // => first h1 wins, as in strict mode with one match
  return found !== null && found[1] !== undefined ? found[1] : ""; // => "" when no h1 exists
} // => matchHeading returns the heading text

await main(); // => run once; a failure throws and exits nonzero
