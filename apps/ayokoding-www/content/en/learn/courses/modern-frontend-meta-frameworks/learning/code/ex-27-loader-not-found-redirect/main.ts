// Worked Example 27: Loader not-found and redirect.
// => NusaMart is fictional; every product id here is fixed.
// => A loader can refuse to render: an unknown id throws not-found and the
// => framework renders the nearest error slot; a moved id redirects before
// => any HTML. Both decisions happen before the first byte of the page.

// => Fixed catalog plus one moved id: gula-003 now lives under a new slug.
const IDS = ["kopi-001", "teh-002"]; // => current ids
const MOVED: Record<string, string> = { "gula-003": "/products/gula-aren" }; // => old to new

// => The loader verdict: render the row, redirect the moved id, or refuse
// => the unknown id. Order matters: moves are checked before misses.
function loadDetail(id: string): string {
  // => loader verdict
  const target = MOVED[id]; // => the new home, if this id moved
  if (target !== undefined) {
    // => moved id
    return "redirect to " + target; // => before any HTML
  } // => end of the moved branch
  if (!IDS.includes(id)) {
    // => unknown id
    return "not-found: " + id; // => nearest error slot renders
  } // => end of the unknown branch
  return "render " + id; // => the row renders
} // => end of loadDetail

console.log(loadDetail("teh-002")); // => Output render teh-002
console.log(loadDetail("gula-003")); // => Output redirect to /products/gula-aren
console.log(loadDetail("susu-009")); // => Output not-found: susu-009
export {}; // => module scope keeps these names local
