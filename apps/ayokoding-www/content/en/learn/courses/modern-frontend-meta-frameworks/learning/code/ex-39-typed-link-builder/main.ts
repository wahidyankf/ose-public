// Worked Example 39: Typed link builder.
// => NusaMart is fictional; every product id here is fixed.
// => Type-safe routing moves broken links from runtime to compile time: the
// => route table is a type, buildPath only accepts its keys, and a wrong
// => path fails tsc instead of failing a visitor. This anchor serves the
// => typed paths over loopback and reads them back to prove they resolve.
declare const require: any; // => Node-only import without @types/node in the harness
const http: any = require("node:http"); // => standard-library HTTP server, no dependency

// => The route table as a type: every legal path and its param names.
// => Add a route here and every link builder learns it; miss one and tsc
// => rejects the link before the app ever runs.
const ROUTES = {
  // => fixed route table
  "/": [], // => root takes no params
  "/products": [], // => list takes no params
  "/products/:id": ["id"], // => detail takes one param
} as const; // => literal types, never widened
type RoutePath = keyof typeof ROUTES; // => the legal path union

// => Build a path from a legal route plus its params: unknown routes and
// => missing params are type errors, caught by tsc, never by a visitor.
function buildPath(path: RoutePath, params: Record<string, string> = {}): string {
  // => typed link builder
  let built: string = path; // => the growing URL
  for (const [key, value] of Object.entries(params)) {
    // => every supplied param
    built = built.replace(":" + key, value); // => fill its hole
  } // => end of the param loop
  return built; // => the finished URL
} // => end of buildPath

// => Fixed catalog ids: the only values links may carry.
const IDS = ["kopi-001", "teh-002"]; // => two fictional goods

// => One loopback server: any built path that matches a table entry renders;
// => anything else 404s, which typed links can never produce.
async function main(): Promise<void> {
  // => script entry point
  const server: any = http.createServer((req: any, res: any) => {
    // => one server, typed links only
    const url: string = req.url ?? "/"; // => the request path
    const known = url === "/" || url === "/products" || /^\/products\/[^/]+$/.test(url); // => table check
    if (!known) {
      // => outside the table
      res.writeHead(404, { "content-type": "text/plain" }); // => miss status
      res.end("no such route"); // => miss body
      return; // => stop here
    } // => end of the miss branch
    res.writeHead(200, { "content-type": "text/plain" }); // => hit status
    res.end("typed hit: " + url); // => hit body
  }); // => end of the request handler
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve)); // => ephemeral loopback port
  const port: number = server.address().port; // => the assigned port, never printed
  const get = async (path: string): Promise<string> => {
    // => one headless request
    const res: any = await fetch("http://127.0.0.1:" + port + path); // => loopback only
    return "GET " + path + " -> " + res.status + " " + (await res.text()); // => status plus body
  }; // => end of get
  console.log(await get(buildPath("/"))); // => Output typed hit for root
  console.log(await get(buildPath("/products"))); // => Output typed hit for list
  console.log(await get(buildPath("/products/:id", { id: IDS[0] }))); // => Output typed hit for detail
  console.log(await get(buildPath("/products/:id", { id: IDS[1] }))); // => Output typed hit for detail
  await new Promise<void>((resolve) => server.close(() => resolve())); // => stop serving
} // => end of main

void main(); // => run the script
export {}; // => module scope keeps these names local
