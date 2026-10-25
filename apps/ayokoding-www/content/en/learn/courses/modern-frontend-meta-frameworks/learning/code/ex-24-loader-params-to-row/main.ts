// Worked Example 24: Loader params to row.
// => NusaMart is fictional; every product and price here is fixed.
// => The loader's only input is the route params: it validates the param,
// => reads exactly one row, and names its failure modes. No param, no query.

// => Fixed catalog: the only rows any loader may return.
type Product = { id: string; name: string; price: number }; // => shop row shape
const PRODUCTS: Product[] = [
  // => three fictional goods, prices in rupiah
  { id: "kopi-001", name: "Kopi Toraja 250g", price: 68000 }, // => first shelf row
  { id: "teh-002", name: "Teh Melati 100g", price: 32000 }, // => second shelf row
]; // => end of the fixed catalog

// => The loader contract: params in, one row out, or a named failure.
// => Empty means the segment is missing; unknown means no such product.
function load(params: { productId?: string }): string {
  // => loader function
  const id = params.productId ?? ""; // => the route param, maybe absent
  if (id === "") {
    // => missing segment
    return "loader: missing productId"; // => named failure one
  } // => end of the missing branch
  const found = PRODUCTS.find((p) => p.id === id); // => exactly one row read
  if (found === undefined) {
    // => unknown id
    return "loader: unknown " + id; // => named failure two
  } // => end of the unknown branch
  return "loader: " + found.name + " " + found.price; // => the loaded row
} // => end of load

console.log(load({ productId: "teh-002" })); // => Output the Teh row
console.log(load({})); // => Output missing productId
console.log(load({ productId: "susu-009" })); // => Output unknown susu-009
export {}; // => module scope keeps these names local
