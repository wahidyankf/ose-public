// Worked Example 11: Server HTML first paint.
// => NusaMart is fictional; every product and price here is fixed.
// => Server rendering means the HTML arrives with content already inside:
// => this anchor renders the product list on the server for both dialects,
// => serves the HTML over loopback, and reads it back to prove the names
// => are in the first bytes, before any JavaScript runs.
declare const require: any; // => Node-only import without @types/node in the harness
const http: any = require("node:http"); // => standard-library HTTP server, no dependency

// => Fixed catalog: the only rows the server may render.
type Product = { id: string; name: string; price: number }; // => shop row shape
const PRODUCTS: Product[] = [
  // => three fictional goods, prices in rupiah
  { id: "kopi-001", name: "Kopi Toraja 250g", price: 68000 }, // => first shelf row
  { id: "teh-002", name: "Teh Melati 100g", price: 32000 }, // => second shelf row
  { id: "gula-003", name: "Gula Aren 500g", price: 21000 }, // => third shelf row
]; // => end of the fixed catalog

// => Next.js Server Component: an async page awaits its data, then returns
// => HTML with the rows already inside; no client JavaScript needed to read.
function nextServerHtml(): string {
  // => Next-style server render
  const rows = PRODUCTS.map((p) => "<li>" + p.name + " " + p.price + "</li>").join(""); // => rows first
  return "<ul>" + rows + "</ul>"; // => list HTML with content inside
} // => end of nextServerHtml

// => TanStack Start SSR: the loader resolves before render, so the HTML
// => the server streams already contains the same rows.
function startServerHtml(): string {
  // => Start-style server render
  const rows = PRODUCTS.map((p) => "<li>" + p.name + " " + p.price + "</li>").join(""); // => rows first
  return "<ul>" + rows + "</ul>"; // => list HTML with content inside
} // => end of startServerHtml

// => One loopback server answers /next/ssr and /start/ssr with server HTML;
// => the reader then checks the first paint already names a product.
async function main(): Promise<void> {
  // => script entry point
  const server: any = http.createServer((req: any, res: any) => {
    // => one server, two server renders
    const url: string = req.url ?? "/"; // => the request path
    let html = ""; // => the server HTML
    if (url === "/next/ssr") {
      // => Next.js server render owns this path
      html = nextServerHtml(); // => rows rendered on the server
    } else if (url === "/start/ssr") {
      // => Start server render owns this path
      html = startServerHtml(); // => rows rendered on the server
    } else {
      // => anything else misses
      res.writeHead(404, { "content-type": "text/plain" }); // => status line
      res.end("unknown render path"); // => miss body
      return; // => stop here
    } // => end of the path choice
    res.writeHead(200, { "content-type": "text/html" }); // => HTML status line
    res.end(html); // => HTML with content already inside
  }); // => end of the request handler
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve)); // => ephemeral loopback port
  const port: number = server.address().port; // => the assigned port, never printed
  const paints = async (path: string): Promise<string> => {
    // => one headless first paint
    const res: any = await fetch("http://127.0.0.1:" + port + path); // => loopback only
    const html: string = await res.text(); // => the full first HTML
    return "GET " + path + " -> " + res.status + " paints-kopi=" + html.includes("Kopi Toraja"); // => name check
  }; // => end of paints
  console.log(await paints("/next/ssr")); // => Output true: content in first HTML
  console.log(await paints("/start/ssr")); // => Output true: content in first HTML
  await new Promise<void>((resolve) => server.close(() => resolve())); // => stop serving
} // => end of main

void main(); // => run the script
export {}; // => module scope keeps these names local
