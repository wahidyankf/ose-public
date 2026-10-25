// Worked Example 22: Loader before render.
// => NusaMart is fictional; every product and price here is fixed.
// => Server data loading fetches what the page needs before it renders: the
// => loader resolves first, the HTML carries the answer. This anchor serves
// => a loader-backed detail page over loopback and reads it back to prove
// => the price arrived with the first HTML, on both dialects.
declare const require: any; // => Node-only import without @types/node in the harness
const http: any = require("node:http"); // => standard-library HTTP server, no dependency

// => Fixed catalog: the only rows any loader may return.
type Product = { id: string; name: string; price: number }; // => shop row shape
const PRODUCTS: Product[] = [
  // => three fictional goods, prices in rupiah
  { id: "kopi-001", name: "Kopi Toraja 250g", price: 68000 }, // => first shelf row
  { id: "teh-002", name: "Teh Melati 100g", price: 32000 }, // => second shelf row
  { id: "gula-003", name: "Gula Aren 500g", price: 21000 }, // => third shelf row
]; // => end of the fixed catalog

// => Next.js spelling: the async Server Component awaits its data inline,
// => then renders; the await blocks the segment, nothing renders half-ready.
function nextDetail(id: string): { status: number; body: string } {
  // => Next-style loader render
  const found = PRODUCTS.find((p) => p.id === id); // => the inline data fetch
  if (found === undefined) {
    // => unknown id
    return { status: 404, body: "next: product not found" }; // => miss body
  } // => end of the miss branch
  return { status: 200, body: "next: " + found.name + " " + found.price }; // => data plus render
} // => end of nextDetail

// => Start spelling: the route loader resolves before the component, so the
// => component reads useLoaderData instead of fetching; same order, new name.
function startDetail(id: string): { status: number; body: string } {
  // => Start-style loader render
  const found = PRODUCTS.find((p) => p.id === id); // => the loader fetch
  if (found === undefined) {
    // => unknown id
    return { status: 404, body: "start: product not found" }; // => miss body
  } // => end of the miss branch
  return { status: 200, body: "start: " + found.name + " " + found.price }; // => data plus render
} // => end of startDetail

// => One loopback server: /next/detail/:id and /start/detail/:id both load
// => before they render; the transcript shows data with first HTML.
async function main(): Promise<void> {
  // => script entry point
  const server: any = http.createServer((req: any, res: any) => {
    // => one server, two loaders
    const url: string = req.url ?? "/"; // => the request path
    const hit = url.match(/^\/(next|start)\/detail\/([^/]+)$/); // => detail shape, either dialect
    if (hit === null) {
      // => not a detail URL
      res.writeHead(404, { "content-type": "text/plain" }); // => miss status
      res.end("unknown loader path"); // => miss body
      return; // => stop here
    } // => end of the miss branch
    const answered = hit[1] === "next" ? nextDetail(hit[2]) : startDetail(hit[2]); // => dialect dispatch
    res.writeHead(answered.status, { "content-type": "text/plain" }); // => status line
    res.end(answered.body); // => loaded data inside the reply
  }); // => end of the request handler
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve)); // => ephemeral loopback port
  const port: number = server.address().port; // => the assigned port, never printed
  const get = async (path: string): Promise<string> => {
    // => one headless request
    const res: any = await fetch("http://127.0.0.1:" + port + path); // => loopback only
    return "GET " + path + " -> " + res.status + " " + (await res.text()); // => status plus data
  }; // => end of get
  console.log(await get("/next/detail/kopi-001")); // => Output loaded Next.js detail
  console.log(await get("/start/detail/kopi-001")); // => Output loaded Start detail
  console.log(await get("/next/detail/susu-009")); // => Output Next.js miss
  await new Promise<void>((resolve) => server.close(() => resolve())); // => stop serving
} // => end of main

void main(); // => run the script
export {}; // => module scope keeps these names local
