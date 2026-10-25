// Worked Example 41: Link target guard.
// => NusaMart is fictional; every path here is fixed.
// => Even with typed builders, URLs arrive from outside: bookmarks, pasted
// => links, old emails. A runtime guard mirrors the type table and rejects
// => unknown targets before they render, with a named reason per rejection.

// => The legal target set: the same table the type system sees, kept as a
// => runtime list so outside input can be checked against it.
const LEGAL = ["/", "/products", "/products/:id"]; // => legal target shapes

// => Guard one incoming target: legal shapes pass, unknown paths fail with
// => a reason the UI can render instead of a blank page.
function guard(target: string): string {
  // => link target guard
  if (target === "/" || target === "/products") {
    // => static legal targets
    return "pass: " + target; // => render it
  } // => end of the static branch
  if (/^\/products\/[^/]+$/.test(target)) {
    // => detail shape
    return "pass: " + target; // => render it
  } // => end of the detail branch
  if (target.includes("..") || target.includes("//")) {
    // => traversal attempt
    return "reject traversal: " + target; // => named rejection
  } // => end of the traversal branch
  return "reject unknown: " + target; // => named rejection
} // => end of guard

console.log(guard("/products/kopi-001")); // => Output pass
console.log(guard("/products")); // => Output pass
console.log(guard("/admin")); // => Output reject unknown
console.log(guard("/products/../../etc")); // => Output reject traversal
console.log("legal shapes: " + LEGAL.join(",")); // => Output the three shapes
export {}; // => module scope keeps these names local
