// Worked Example 8: Route groups without URLs.
// => NusaMart is fictional; every segment here is fixed.
// => Some folders organize code without adding URL segments: Next.js wraps
// => them in parentheses, TanStack Start uses underscore-prefixed pathless
// => routes. Both hide the folder from the URL while keeping its layout.

// => Next.js convention: a (shop) folder groups routes and can own a
// => layout, but the parentheses never appear in the URL.
function nextVisible(file: string): string {
  // => Next-style URL derivation
  const noGroup = file.replace(/\([^/]+\)\//g, ""); // => drop parenthesized folders
  const noPage = noGroup.replace(/\/page\.tsx$/, ""); // => drop the leaf file
  const noApp = noPage.replace(/^app/, ""); // => drop the app root
  return noApp === "" ? "/" : noApp; // => empty means the root URL
} // => end of nextVisible

// => Start convention: a _shop pathless route groups children under its
// => layout without contributing a segment to the URL.
function startVisible(routeId: string): string {
  // => Start-style URL derivation
  const pieces = routeId.split("/").filter((p) => !p.startsWith("_")); // => drop pathless pieces
  const url = pieces.join("/"); // => rejoin the visible pieces
  return url === "" ? "/" : "/" + url; // => empty means the root URL
} // => end of startVisible

// => The same storefront organized two ways, resolving to identical URLs:
// => grouping is a code-layout tool, never a URL promise.
console.log("next app/(shop)/products/page.tsx => " + nextVisible("app/(shop)/products/page.tsx")); // => Output /products
console.log("next app/(shop)/page.tsx => " + nextVisible("app/(shop)/page.tsx")); // => Output /
console.log("start _shop/products => " + startVisible("_shop/products")); // => Output /products
console.log("start _shop => " + startVisible("_shop")); // => Output / adds no segment
export {}; // => module scope keeps these names local
