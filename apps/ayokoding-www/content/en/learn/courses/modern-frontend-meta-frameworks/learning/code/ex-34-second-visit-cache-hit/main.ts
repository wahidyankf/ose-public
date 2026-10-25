// Worked Example 34: Second-visit cache hit.
// => NusaMart is fictional; every product and price here is fixed.
// => Caching replays a saved reply for a repeat visit: the first request
// => renders and saves, the second request replays without rendering. This
// => anchor serves a cached shelf over loopback and stamps each reply HIT
// => or MISS so the transcript shows the render happening exactly once.
declare const require: any; // => Node-only import without @types/node in the harness
const http: any = require("node:http"); // => standard-library HTTP server, no dependency

// => The cache: one saved reply per path, plus a render counter proving
// => the second visit skipped the work.
let saved = ""; // => the cached shelf HTML
let renders = 0; // => how many times the shelf rendered

// => Render the shelf: the only expensive step, counted every time it runs.
function renderShelf(): string {
  // => shelf renderer
  renders += 1; // => count this render
  return "<ul><li>Kopi Toraja 250g</li><li>Teh Melati 100g</li></ul>"; // => fixed shelf HTML
} // => end of renderShelf

// => One loopback server: the first GET /shelf renders and saves, later
// => GETs replay the save; the x-cache stamp names which happened.
async function main(): Promise<void> {
  // => script entry point
  const server: any = http.createServer((req: any, res: any) => {
    // => one server, one cached page
    if ((req.url ?? "/") !== "/shelf") {
      // => only the shelf is cached here
      res.writeHead(404, { "content-type": "text/plain" }); // => miss status
      res.end("unknown page"); // => miss body
      return; // => stop here
    } // => end of the miss branch
    if (saved === "") {
      // => nothing saved yet
      saved = renderShelf(); // => render once and save
      res.writeHead(200, { "content-type": "text/html", "x-cache": "MISS" }); // => miss stamp
      res.end(saved); // => fresh render
      return; // => stop here
    } // => end of the miss branch
    res.writeHead(200, { "content-type": "text/html", "x-cache": "HIT" }); // => hit stamp
    res.end(saved); // => replay without rendering
  }); // => end of the request handler
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve)); // => ephemeral loopback port
  const port: number = server.address().port; // => the assigned port, never printed
  const get = async (visit: string): Promise<string> => {
    // => one headless visit
    const res: any = await fetch("http://127.0.0.1:" + port + "/shelf"); // => loopback only
    const stamp: string = res.headers.get("x-cache") ?? "?"; // => HIT or MISS
    return visit + " -> " + res.status + " " + stamp + " renders=" + renders + " " + (await res.text()); // => line
  }; // => end of get
  console.log(await get("first visit")); // => Output MISS with renders=1
  console.log(await get("second visit")); // => Output HIT with renders still 1
  console.log(await get("third visit")); // => Output HIT with renders still 1
  await new Promise<void>((resolve) => server.close(() => resolve())); // => stop serving
} // => end of main

void main(); // => run the script
export {}; // => module scope keeps these names local
