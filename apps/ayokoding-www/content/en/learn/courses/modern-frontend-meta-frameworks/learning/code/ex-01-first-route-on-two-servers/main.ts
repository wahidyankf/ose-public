// Worked Example 1: First route on two servers.
// => NusaMart is fictional; every product and price here is fixed.
// => A meta-framework turns a file path into a URL: this anchor serves one
// => Next.js-style route table and one TanStack Start-style route tree over
// => loopback, then reads URLs back with plain fetch, no browser involved.
declare const require: any; // => Node-only import without @types/node in the harness
const http: any = require("node:http"); // => standard-library HTTP server, no dependency

// => Fixed catalog: the only data any route in this example may show.
type Product = { id: string; name: string; price: number }; // => shop row shape
const PRODUCTS: Product[] = [
  // => three fictional goods, prices in rupiah
  { id: "kopi-001", name: "Kopi Toraja 250g", price: 68000 }, // => first shelf row
  { id: "teh-002", name: "Teh Melati 100g", price: 32000 }, // => second shelf row
  { id: "gula-003", name: "Gula Aren 500g", price: 21000 }, // => third shelf row
]; // => end of the fixed catalog

// => Next.js file convention: app/page.tsx, app/products/page.tsx, and
// => app/products/[id]/page.tsx, where square brackets mark a dynamic segment.
function nextBody(url: string): { status: number; body: string } {
  // => Next-style dispatch
  if (url === "/") {
    // => app/page.tsx answers the root
    return { status: 200, body: "next home: NusaMart" }; // => static home line
  } // => end of the root branch
  if (url === "/products") {
    // => app/products/page.tsx lists the shelf
    return { status: 200, body: "next list: " + PRODUCTS.map((p) => p.id).join(",") }; // => id list
  } // => end of the list branch
  const detail = url.match(/^\/products\/([^/]+)$/); // => app/products/[id]/page.tsx shape
  if (detail !== null) {
    // => one segment after /products/ is a detail id
    const found = PRODUCTS.find((p) => p.id === detail[1]); // => look the id up
    if (found !== undefined) {
      // => a known id renders its row
      return { status: 200, body: "next detail: " + found.name + " " + found.price }; // => name plus price
    } // => end of the known-id branch
    return { status: 404, body: "next detail: product not found" }; // => unknown id misses
  } // => end of the detail branch
  return { status: 404, body: "next: page not found" }; // => nothing else matches
} // => end of nextBody

// => TanStack Start file convention: routes/index.tsx,
// => routes/products/index.tsx, and routes/products/$productId.tsx,
// => where a dollar prefix marks a dynamic segment.
function startBody(url: string): { status: number; body: string } {
  // => Start-style dispatch
  if (url === "/") {
    // => routes/index.tsx answers the root
    return { status: 200, body: "start home: NusaMart" }; // => static home line
  } // => end of the root branch
  if (url === "/products") {
    // => routes/products/index.tsx lists the shelf
    return { status: 200, body: "start list: " + PRODUCTS.map((p) => p.id).join(",") }; // => id list
  } // => end of the list branch
  const detail = url.match(/^\/products\/([^/]+)$/); // => routes/products/$productId.tsx shape
  if (detail !== null) {
    // => one segment after /products/ is a product id
    const found = PRODUCTS.find((p) => p.id === detail[1]); // => look the id up
    if (found !== undefined) {
      // => a known id renders its row
      return { status: 200, body: "start detail: " + found.name + " " + found.price }; // => name plus price
    } // => end of the known-id branch
    return { status: 404, body: "start detail: product not found" }; // => unknown id misses
  } // => end of the detail branch
  return { status: 404, body: "start: route not found" }; // => nothing else matches
} // => end of startBody

// => One loopback server hosts both tables: /next/* follows the Next.js
// => file convention and /start/* follows the TanStack Start file convention.
async function main(): Promise<void> {
  // => script entry point
  const server: any = http.createServer((req: any, res: any) => {
    // => one server, two conventions
    const url: string = req.url ?? "/"; // => the request path
    let answered: { status: number; body: string }; // => the chosen reply
    if (url === "/next" || url.startsWith("/next/")) {
      // => Next.js table owns /next/*
      answered = nextBody(url === "/next" ? "/" : url.slice("/next".length)); // => strip the prefix
    } else if (url === "/start" || url.startsWith("/start/")) {
      // => Start tree owns /start/*
      answered = startBody(url === "/start" ? "/" : url.slice("/start".length)); // => strip the prefix
    } else {
      // => no framework owns the bare path
      answered = { status: 404, body: "pick /next/* or /start/*" }; // => guidance reply
    } // => end of the framework choice
    res.writeHead(answered.status, { "content-type": "text/plain" }); // => status line plus type
    res.end(answered.body); // => plain-text body, no HTML shell here
  }); // => end of the request handler
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve)); // => ephemeral loopback port
  const port: number = server.address().port; // => the assigned port, never printed
  const get = async (path: string): Promise<string> => {
    // => one headless request
    const res: any = await fetch("http://127.0.0.1:" + port + path); // => loopback only
    return "GET " + path + " -> " + res.status + " " + (await res.text()); // => status plus body
  }; // => end of get
  console.log(await get("/next/")); // => Output home from the Next.js table
  console.log(await get("/next/products")); // => Output list from the Next.js table
  console.log(await get("/next/products/teh-002")); // => Output detail from the Next.js table
  console.log(await get("/next/products/unknown")); // => Output miss from the Next.js table
  console.log(await get("/start/")); // => Output home from the Start tree
  console.log(await get("/start/products")); // => Output list from the Start tree
  console.log(await get("/start/products/teh-002")); // => Output detail from the Start tree
  console.log(await get("/start/products/unknown")); // => Output miss from the Start tree
  await new Promise<void>((resolve) => server.close(() => resolve())); // => stop serving
} // => end of main

void main(); // => run the script
export {}; // => module scope keeps these names local
