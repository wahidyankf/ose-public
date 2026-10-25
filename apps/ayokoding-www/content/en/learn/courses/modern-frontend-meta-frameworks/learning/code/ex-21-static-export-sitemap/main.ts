// Worked Example 21: Static export sitemap.
// => NusaMart is fictional; every path here is fixed.
// => A fully static site is a file list: the export writes one HTML file per
// => route, and the sitemap is that same list in XML. Anything missing from
// => the list is missing from the site, which is the deployment contract.

// => The exported route list: the whole site, no server required.
const ROUTES = ["/", "/products", "/products/kopi-001", "/products/teh-002", "/about"]; // => five files

// => The export writes one HTML file per route; the filename mirrors the URL.
function exportFiles(): string[] {
  // => static export
  return ROUTES.map((r) => (r === "/" ? "/index.html" : r + ".html")); // => file per route
} // => end of exportFiles

// => The sitemap repeats the route list in XML so crawlers find every page
// => the export wrote: same list, second format, no drift allowed.
function sitemap(): string {
  // => sitemap builder
  const host = "https://fictional-nusamart.example"; // => fictional host, never fetched
  return ROUTES.map((r) => "<url><loc>" + host + r + "</loc></url>").join("\n"); // => one entry per route
} // => end of sitemap

console.log("files: " + exportFiles().join(",")); // => Output the five files
console.log("sitemap entries: " + ROUTES.length); // => Output 5
console.log(sitemap()); // => Output the XML entries
export {}; // => module scope keeps these names local
