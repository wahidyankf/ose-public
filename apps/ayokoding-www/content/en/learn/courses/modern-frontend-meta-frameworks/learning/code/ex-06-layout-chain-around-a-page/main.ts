// Worked Example 6: Layout chain around a page.
// => NusaMart is fictional; every product and price here is fixed.
// => A layout is a shell shared by a route and its children: the root shell
// => wraps the shop shell, which wraps the page. This anchor serves the
// => nested shells over loopback and reads the composed HTML back.
declare const require: any; // => Node-only import without @types/node in the harness
const http: any = require("node:http"); // => standard-library HTTP server, no dependency

// => The fixed page body both layouts will wrap.
const PAGE_BODY = "<h1>Teh Melati 100g</h1><p>32000</p>"; // => one fictional product

// => Next.js file convention: app/layout.tsx wraps every route, and
// => app/products/layout.tsx wraps only the product subtree; children is
// => the hole the next level down fills.
function nextRootLayout(children: string): string {
  // => Next-style root shell
  return "<html><body><header>NusaMart</header>" + children + "</body></html>"; // => header plus hole
} // => end of nextRootLayout

// => The shop section shell: a sidebar the root shell knows nothing about.
function nextShopLayout(children: string): string {
  // => Next-style section shell
  return "<div class='shop'><nav>shelf</nav>" + children + "</div>"; // => nav plus hole
} // => end of nextShopLayout

// => TanStack Start convention: routes/__root.tsx always renders and hosts
// => <Outlet/>, while routes/products/route.tsx nests the product subtree.
function startRootLayout(children: string): string {
  // => Start-style root shell
  return "<html><body><header>NusaMart</header>" + children + "</body></html>"; // => header plus hole
} // => end of startRootLayout

// => The product section shell in the Start dialect: same shape, Outlet hole.
function startProductsLayout(children: string): string {
  // => Start-style section shell
  return "<div class='shop'><nav>shelf</nav>" + children + "</div>"; // => nav plus hole
} // => end of startProductsLayout

// => Composition order is outside-in: the root shell wraps the section
// => shell, which wraps the page. Swap the order and the sidebar escapes.
function composeNext(): string {
  // => Next-style composition
  return nextRootLayout(nextShopLayout(PAGE_BODY)); // => root outside, page inside
} // => end of composeNext

// => The Start tree composes identically: root outside, section, then page.
function composeStart(): string {
  // => Start-style composition
  return startRootLayout(startProductsLayout(PAGE_BODY)); // => root outside, page inside
} // => end of composeStart

// => One loopback server answers /next/layout and /start/layout with the
// => fully composed HTML of each dialect's layout chain.
async function main(): Promise<void> {
  // => script entry point
  const server: any = http.createServer((req: any, res: any) => {
    // => one server, two layout chains
    const url: string = req.url ?? "/"; // => the request path
    let body = ""; // => the composed HTML
    if (url === "/next/layout") {
      // => Next.js chain owns this path
      body = composeNext(); // => root wraps section wraps page
    } else if (url === "/start/layout") {
      // => Start chain owns this path
      body = composeStart(); // => root wraps section wraps page
    } else {
      // => anything else misses
      res.writeHead(404, { "content-type": "text/plain" }); // => status line
      res.end("unknown layout path"); // => miss body
      return; // => stop here
    } // => end of the path choice
    res.writeHead(200, { "content-type": "text/html" }); // => HTML status line
    res.end(body); // => the composed shells plus page
  }); // => end of the request handler
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve)); // => ephemeral loopback port
  const port: number = server.address().port; // => the assigned port, never printed
  const get = async (path: string): Promise<string> => {
    // => one headless request
    const res: any = await fetch("http://127.0.0.1:" + port + path); // => loopback only
    return "GET " + path + " -> " + res.status + " " + (await res.text()); // => status plus HTML
  }; // => end of get
  console.log(await get("/next/layout")); // => Output nested Next.js shells plus page
  console.log(await get("/start/layout")); // => Output nested Start shells plus page
  await new Promise<void>((resolve) => server.close(() => resolve())); // => stop serving
} // => end of main

void main(); // => run the script
export {}; // => module scope keeps these names local
