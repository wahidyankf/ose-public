// Worked Example 3: Dynamic segment values.
// => NusaMart is fictional; every product and price here is fixed.
// => A dynamic segment is a named hole in the URL: the framework pulls the
// => value out and hands it to the page as a typed parameter object.

// => Fixed catalog: the only ids any extraction below may resolve.
const KNOWN_IDS = ["kopi-001", "teh-002", "gula-003"]; // => three fictional goods

// => Next.js spells the hole [id] and hands the page { params: { id } };
// => TanStack Start spells it $productId and hands the loader { productId }.
function extractNext(url: string): { id: string } | null {
  // => Next-style extraction
  const hit = url.match(/^\/products\/([^/]+)$/); // => [id] accepts one segment
  if (hit === null) {
    // => no segment means no match
    return null; // => list URLs carry no id
  } // => end of the miss branch
  return { id: hit[1] }; // => the captured segment under its name
} // => end of extractNext

// => Start spells the same hole $productId: one segment, different name,
// => same value, and the loader receives it before the component renders.
function extractStart(url: string): { productId: string } | null {
  // => Start-style extraction
  const hit = url.match(/^\/products\/([^/]+)$/); // => $productId accepts one segment
  if (hit === null) {
    // => no segment means no match
    return null; // => list URLs carry no id
  } // => end of the miss branch
  return { productId: hit[1] }; // => the captured segment under its name
} // => end of extractStart

// => Extraction is only half the job: the page then resolves the value
// => against real data, and an unknown value is a miss, not a crash.
function resolve(ids: string[], value: string): string {
  // => id resolver
  return ids.includes(value) ? "found " + value : "missing " + value; // => found or missing
} // => end of resolve

const nextParams = extractNext("/products/gula-003"); // => pull [id] from the URL
console.log("next params: " + JSON.stringify(nextParams)); // => Output {"id":"gula-003"}
console.log("next resolve: " + resolve(KNOWN_IDS, nextParams?.id ?? "")); // => Output found gula-003
const startParams = extractStart("/products/gula-003"); // => pull $productId from the URL
console.log("start params: " + JSON.stringify(startParams)); // => Output {"productId":"gula-003"}
console.log("start resolve: " + resolve(KNOWN_IDS, startParams?.productId ?? "")); // => Output found gula-003
console.log("next resolve unknown: " + resolve(KNOWN_IDS, "susu-009")); // => Output missing susu-009
export {}; // => module scope keeps these names local
