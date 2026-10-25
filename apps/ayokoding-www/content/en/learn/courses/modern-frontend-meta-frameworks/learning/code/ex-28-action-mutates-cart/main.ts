// Worked Example 28: Action mutates cart.
// => NusaMart is fictional; every product and quantity here is fixed.
// => A server action is a mutation callable from a client component: the
// => browser posts intent, the server validates and owns the cart, and the
// => reply carries the new count. This anchor serves a cart action over
// => loopback for both dialects and posts two intents to prove the count.
declare const require: any; // => Node-only import without @types/node in the harness
const http: any = require("node:http"); // => standard-library HTTP server, no dependency

// => Fixed prices: the only math any action may do.
const PRICES: Record<string, number> = {
  // => fictional price list
  "kopi-001": 68000, // => Kopi Toraja 250g
  "teh-002": 32000, // => Teh Melati 100g
}; // => end of the price list

// => One cart per dialect: server-owned state the client may only change
// => through the action, never by editing a reply.
const carts: Record<string, Record<string, number>> = { next: {}, start: {} }; // => server carts

// => The action contract: read the intent, validate it, mutate, reply with
// => the new count and total. Invalid intent changes nothing.
function cartAction(side: string, id: string, qty: number): { status: number; body: string } {
  // => server action
  if (PRICES[id] === undefined) {
    // => unknown product
    return { status: 422, body: side + " cart: unknown " + id }; // => no mutation
  } // => end of the unknown branch
  if (!Number.isInteger(qty) || qty < 1 || qty > 9) {
    // => bad quantity
    return { status: 422, body: side + " cart: bad qty " + qty }; // => no mutation
  } // => end of the quantity branch
  const cart = carts[side]; // => this dialect's cart
  cart[id] = (cart[id] ?? 0) + qty; // => the mutation
  const count = Object.values(cart).reduce((a, b) => a + b, 0); // => new item count
  const total = Object.entries(cart).reduce((a, [k, q]) => a + PRICES[k] * q, 0); // => new total
  return { status: 200, body: side + " cart: count " + count + " total " + total }; // => the reply
} // => end of cartAction

// => One loopback server: POST /next/cart/add and /start/cart/add run the
// => action; the body carries id and qty as a tiny JSON intent.
async function main(): Promise<void> {
  // => script entry point
  const server: any = http.createServer((req: any, res: any) => {
    // => one server, two actions
    const url: string = req.url ?? "/"; // => the request path
    const hit = url.match(/^\/(next|start)\/cart\/add$/); // => action shape, either dialect
    if (req.method !== "POST" || hit === null) {
      // => wrong method or path
      res.writeHead(404, { "content-type": "text/plain" }); // => miss status
      res.end("unknown action path"); // => miss body
      return; // => stop here
    } // => end of the miss branch
    let raw = ""; // => the intent bytes
    req.on("data", (c: any) => (raw += c)); // => collect the body
    req.on("end", () => {
      // => intent complete
      const intent = JSON.parse(raw) as { id: string; qty: number }; // => the posted intent
      const answered = cartAction(hit[1], intent.id, intent.qty); // => run the action
      res.writeHead(answered.status, { "content-type": "text/plain" }); // => status line
      res.end(answered.body); // => new count and total
    }); // => end of the intent handler
  }); // => end of the request handler
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve)); // => ephemeral loopback port
  const port: number = server.address().port; // => the assigned port, never printed
  const post = async (path: string, id: string, qty: number): Promise<string> => {
    // => one headless intent
    const res: any = await fetch("http://127.0.0.1:" + port + path, {
      // => loopback only
      method: "POST", // => actions mutate, so they post
      body: JSON.stringify({ id, qty }), // => the intent
    }); // => end of the post
    return "POST " + path + " " + id + " x" + qty + " -> " + res.status + " " + (await res.text()); // => reply
  }; // => end of post
  console.log(await post("/next/cart/add", "kopi-001", 2)); // => Output count 2 total 136000
  console.log(await post("/next/cart/add", "teh-002", 1)); // => Output count 3 total 168000
  console.log(await post("/start/cart/add", "kopi-001", 2)); // => Output count 2 total 136000
  console.log(await post("/next/cart/add", "susu-009", 1)); // => Output 422 unknown
  await new Promise<void>((resolve) => server.close(() => resolve())); // => stop serving
} // => end of main

void main(); // => run the script
export {}; // => module scope keeps these names local
