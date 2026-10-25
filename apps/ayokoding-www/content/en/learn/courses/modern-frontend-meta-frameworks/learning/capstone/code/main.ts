// Capstone: the same product-catalog app twice, compared.
// => NusaMart is fictional; every product and quantity here is fixed.
// => One request script (list, detail, add, bad add) runs against a
// => Next.js-style model and a TanStack Start-style model, and the final
// => table shows both dialects answering identically: conventions differ,
// => behavior agrees.

// => Fixed catalog: both models read the same fictional rows.
type Product = { id: string; name: string; price: number }; // => shop row shape
const PRODUCTS: Product[] = [
  // => three fictional goods, prices in rupiah
  { id: "kopi-001", name: "Kopi Toraja 250g", price: 68000 }, // => first shelf row
  { id: "teh-002", name: "Teh Melati 100g", price: 32000 }, // => second shelf row
  { id: "gula-003", name: "Gula Aren 500g", price: 21000 }, // => third shelf row
]; // => end of the fixed catalog

// => A catalog model answers the four script steps: list ids, detail one
// => row, add to the cart, and report the cart. Both dialects implement it.
type Model = {
  // => catalog model shape
  list: () => string; // => list step
  detail: (id: string) => string; // => detail step
  add: (id: string, qty: number) => string; // => mutation step
  cart: () => string; // => cart report
}; // => end of Model

// => Build one model per dialect: Next.js reads like an async Server
// => Component plus a server action; Start reads like a loader plus a
// => server function. The bodies below share the logic on purpose.
function buildModel(side: "next" | "start"): Model {
  // => model builder
  const cart: Record<string, number> = {}; // => server-owned cart
  return {
    // => the four steps
    list: () => side + ": list " + PRODUCTS.map((p) => p.id).join(","), // => list step
    detail: (id: string) => {
      // => detail step
      const found = PRODUCTS.find((p) => p.id === id); // => the loader read
      return found === undefined ? side + ": not-found " + id : side + ": detail " + found.name + " " + found.price; // => row or miss
    }, // => end of detail
    add: (id: string, qty: number) => {
      // => mutation step
      if (PRODUCTS.find((p) => p.id === id) === undefined) {
        // => unknown product
        return side + ": error unknown " + id; // => named failure
      } // => end of the unknown branch
      if (!Number.isInteger(qty) || qty < 1 || qty > 9) {
        // => bad quantity
        return side + ": error bad-qty " + qty; // => named failure
      } // => end of the quantity branch
      cart[id] = (cart[id] ?? 0) + qty; // => the mutation
      return side + ": added " + qty + " x " + id; // => success reply
    }, // => end of add
    cart: () => {
      // => cart report
      const lines = Object.entries(cart).map(([k, q]) => k + " x" + q); // => cart lines
      const total = Object.entries(cart).reduce(
        (a, [k, q]) => a + (PRODUCTS.find((p) => p.id === k)?.price ?? 0) * q,
        0,
      ); // => cart total
      return side + ": cart [" + lines.join(",") + "] total " + total; // => the report
    }, // => end of cart
  }; // => end of the steps
} // => end of buildModel

// => The shared request script: the same four steps run on both models,
// => and the comparison prints agree whenever the bodies match after the
// => dialect tag.
const next = buildModel("next"); // => Next.js-style model
const start = buildModel("start"); // => Start-style model
const steps: [string, (m: Model) => string][] = [
  // => the script
  ["list", (m) => m.list()], // => step one
  ["detail teh-002", (m) => m.detail("teh-002")], // => step two
  ["add 2 kopi", (m) => m.add("kopi-001", 2)], // => step three
  ["add ghost", (m) => m.add("susu-009", 1)], // => step four
  ["cart", (m) => m.cart()], // => step five
]; // => end of the script
for (const [name, run] of steps) {
  // => each step on both models
  const a = run(next); // => Next.js answer
  const b = run(start); // => Start answer
  const strip = (s: string): string => s.replace(/^(next|start):/, ""); // => drop the dialect tag
  console.log(name + ": next=" + a + " | start=" + b + " agree=" + (strip(a) === strip(b))); // => Output the pair
} // => end of the script loop
export {}; // => module scope keeps these names local
