// Example 33: API Testing With Request Context. (co-14: api-testing)
// => Playwright 1.60.0, docs accessed 2026-10-20; request.newContext drives
// => the API directly with no browser page: faster than UI tests for
// => contract coverage, sharing fixtures and reporters with them. The context
// => is disposed after the suite:
// =>   real: const api = await request.newContext({ baseURL: "http://127.0.0.1:PORT" });
import http from "node:http"; // => node:http serves the fixture API with no network

async function main(): Promise<void> {
  // => entry point for the API check
  const server = http.createServer((req, res) => {
    // => the fixture API under test
    if (req.url === "/api/cart" && req.method === "GET") {
      // => the cart endpoint
      res.writeHead(200, { "content-type": "application/json" }); // => JSON reply
      res.end('{"items":["milk"],"total":"$3.00"}'); // => one item, known total
    } else {
      // => anything else is unknown
      res.writeHead(404, { "content-type": "text/plain" }); // => plain 404
      res.end("no such endpoint"); // => the body names the miss
    } // => routing ends
  }); // => server defined; not yet listening
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve)); // => free loopback port, never printed
  const address = server.address(); // => the bound address object
  const port: number = typeof address === "object" && address !== null ? address.port : 0; // => the chosen port number
  const base = "http://127.0.0.1:" + String(port); // => the base URL every call shares
  const cart = (await (await fetch(base + "/api/cart")).json()) as { items: string[]; total: string }; // => real: await api.get("/api/cart")
  console.log("items: " + cart.items.join(",")); // => Output: items: milk
  console.log("total: " + cart.total); // => Output: total: $3.00
  const missing: number = (await fetch(base + "/api/admin")).status; // => unknown endpoint
  console.log("missing status: " + String(missing)); // => Output: missing status: 404
  console.log("api covered without browser: " + String(cart.total === "$3.00" && missing === 404)); // => Output: api covered without browser: true
  server.close(); // => dispose the context equivalent
} // => main ends; the API answered, the page never opened

await main(); // => run once; a failure throws and exits nonzero
