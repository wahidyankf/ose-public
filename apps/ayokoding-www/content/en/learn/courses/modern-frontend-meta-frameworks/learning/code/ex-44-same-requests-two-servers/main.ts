// Worked Example 44: Same requests, two servers.
// => NusaMart is fictional; every product and price here is fixed.
// => The comparison anchor: one request script hits the same three URLs on
// => a Next.js-style server and a TanStack Start-style server, and the
// => transcript lines up the pair so agreements and differences are visible
// => side by side instead of argued from memory.
declare const require: any; // => Node-only import without @types/node in the harness
const http: any = require("node:http"); // => standard-library HTTP server, no dependency

// => Fixed catalog: both servers read the same fictional rows.
type Product = { id: string; name: string; price: number }; // => shop row shape
const PRODUCTS: Product[] = [
  // => two fictional goods, prices in rupiah
  { id: "kopi-001", name: "Kopi Toraja 250g", price: 68000 }, // => first shelf row
  { id: "teh-002", name: "Teh Melati 100g", price: 32000 }, // => second shelf row
]; // => end of the fixed catalog

// => Next.js-style answers: app/page.tsx, app/products/page.tsx, and
// => app/products/[id]/page.tsx with its async data read.
function nextAnswer(url: string): { status: number; body: string } {
  // => Next-style dispatch
  if (url === "/") {
    // => home
    return { status: 200, body: "home with 2 goods" }; // => static home
  } // => end of the home branch
  if (url === "/products") {
    // => list
    return { status: 200, body: "list: " + PRODUCTS.map((p) => p.id).join(",") }; // => id list
  } // => end of the list branch
  const found = PRODUCTS.find((p) => "/products/" + p.id === url); // => detail lookup
  if (found !== undefined) {
    // => known id
    return { status: 200, body: "detail: " + found.name + " " + found.price }; // => row
  } // => end of the known branch
  return { status: 404, body: "next: not found" }; // => miss
} // => end of nextAnswer

// => Start-style answers: routes/index.tsx, routes/products/index.tsx, and
// => routes/products/$productId.tsx with its loader read. Same data, and
// => the transcript will show whether the bodies agree.
function startAnswer(url: string): { status: number; body: string } {
  // => Start-style dispatch
  if (url === "/") {
    // => home
    return { status: 200, body: "home with 2 goods" }; // => static home
  } // => end of the home branch
  if (url === "/products") {
    // => list
    return { status: 200, body: "list: " + PRODUCTS.map((p) => p.id).join(",") }; // => id list
  } // => end of the list branch
  const found = PRODUCTS.find((p) => "/products/" + p.id === url); // => loader lookup
  if (found !== undefined) {
    // => known id
    return { status: 200, body: "detail: " + found.name + " " + found.price }; // => row
  } // => end of the known branch
  return { status: 404, body: "start: not found" }; // => miss
} // => end of startAnswer

// => One loopback server hosts both dialects under /next and /start; one
// => request script visits home, list, and one detail on each side.
async function main(): Promise<void> {
  // => script entry point
  const server: any = http.createServer((req: any, res: any) => {
    // => one server, two dialects
    const url: string = req.url ?? "/"; // => the request path
    let answered: { status: number; body: string } | null = null; // => the reply
    if (url === "/next" || url.startsWith("/next/")) {
      // => Next.js side
      answered = nextAnswer(url === "/next" ? "/" : url.slice("/next".length)); // => strip prefix
    } else if (url === "/start" || url.startsWith("/start/")) {
      // => Start side
      answered = startAnswer(url === "/start" ? "/" : url.slice("/start".length)); // => strip prefix
    } // => end of the side choice
    if (answered === null) {
      // => neither side
      res.writeHead(404, { "content-type": "text/plain" }); // => miss status
      res.end("pick /next/* or /start/*"); // => miss body
      return; // => stop here
    } // => end of the miss branch
    res.writeHead(answered.status, { "content-type": "text/plain" }); // => status line
    res.end(answered.body); // => the dialect's answer
  }); // => end of the request handler
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve)); // => ephemeral loopback port
  const port: number = server.address().port; // => the assigned port, never printed
  const script = ["/", "/products", "/products/teh-002", "/products/susu-009"]; // => shared request script
  for (const path of script) {
    // => each URL on both sides
    const lines: string[] = []; // => the paired replies
    for (const side of ["next", "start"]) {
      // => both dialects
      const res: any = await fetch("http://127.0.0.1:" + port + "/" + side + path); // => loopback only
      lines.push(side + " " + res.status + " " + (await res.text())); // => status plus body
    } // => end of the side loop
    console.log(path + " => " + lines.join(" | ")); // => Output the pair
  } // => end of the script loop
  await new Promise<void>((resolve) => server.close(() => resolve())); // => stop serving
} // => end of main

void main(); // => run the script
export {}; // => module scope keeps these names local
