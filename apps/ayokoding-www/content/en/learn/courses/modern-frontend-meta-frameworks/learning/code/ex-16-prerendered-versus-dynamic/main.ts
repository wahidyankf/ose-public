// Worked Example 16: Prerendered versus dynamic.
// => NusaMart is fictional; every product and price here is fixed.
// => Static generation renders once at build time and replays the saved
// => HTML; dynamic routes render per request. This anchor serves one saved
// => page and one per-request page over loopback and stamps each reply with
// => which path it took, so the difference is observable in the transcript.
declare const require: any; // => Node-only import without @types/node in the harness
const http: any = require("node:http"); // => standard-library HTTP server, no dependency

// => The build step ran once, long ago: its saved HTML never changes.
const BUILT_HTML = "<h1>NusaMart shelf</h1><p>3 goods</p>"; // => frozen at build time
const BUILD_ID = "build-042"; // => fixed build stamp, not a clock read

// => The cart is per-visitor: it must render per request, never from cache.
function dynamicCart(query: string): string {
  // => dynamic render
  return "<p>cart for " + query + "</p>"; // => fresh HTML per request
} // => end of dynamicCart

// => One loopback server: /about replays the build artifact with its stamp,
// => /cart renders per request and says so.
async function main(): Promise<void> {
  // => script entry point
  const server: any = http.createServer((req: any, res: any) => {
    // => one server, two render paths
    const url: string = req.url ?? "/"; // => the request path
    if (url === "/about") {
      // => prerendered page owns this path
      res.writeHead(200, { "content-type": "text/html", "x-render": "static" }); // => static stamp
      res.end(BUILT_HTML + "<!-- " + BUILD_ID + " -->"); // => saved HTML plus stamp
      return; // => stop here
    } // => end of the static branch
    if (url.startsWith("/cart")) {
      // => dynamic page owns this path
      res.writeHead(200, { "content-type": "text/html", "x-render": "dynamic" }); // => dynamic stamp
      res.end(dynamicCart(url)); // => fresh HTML per request
      return; // => stop here
    } // => end of the dynamic branch
    res.writeHead(404, { "content-type": "text/plain" }); // => miss status
    res.end("unknown page"); // => miss body
  }); // => end of the request handler
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve)); // => ephemeral loopback port
  const port: number = server.address().port; // => the assigned port, never printed
  const get = async (path: string): Promise<string> => {
    // => one headless request
    const res: any = await fetch("http://127.0.0.1:" + port + path); // => loopback only
    const mode: string = res.headers.get("x-render") ?? "miss"; // => which path served
    return "GET " + path + " -> " + res.status + " " + mode + " " + (await res.text()); // => full line
  }; // => end of get
  console.log(await get("/about")); // => Output static replay with build stamp
  console.log(await get("/cart?guest=7")); // => Output dynamic render for guest 7
  console.log(await get("/cart?guest=8")); // => Output dynamic render for guest 8
  await new Promise<void>((resolve) => server.close(() => resolve())); // => stop serving
} // => end of main

void main(); // => run the script
export {}; // => module scope keeps these names local
