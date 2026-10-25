// Worked Example 17: Static paths at build.
// => NusaMart is fictional; every product id here is fixed.
// => Static detail pages need their id list at build time: Next.js calls it
// => generateStaticParams, TanStack Start prerenders the routes its crawler
// => reaches. Either way the rule is one list in, one HTML file per id out.

// => Fixed catalog ids: the entire universe of detail pages.
const IDS = ["kopi-001", "teh-002", "gula-003"]; // => three fictional goods

// => Next.js spelling: generateStaticParams returns one params object per
// => page; the builder renders each id exactly once.
function nextStaticParams(): { id: string }[] {
  // => Next-style build list
  return IDS.map((id) => ({ id })); // => one object per page
} // => end of nextStaticParams

// => Start spelling: the prerender crawler discovers the same three links
// => from the shelf page; the builder renders each discovered route once.
function startDiscoveredLinks(): string[] {
  // => Start-style discovered routes
  return IDS.map((id) => "/products/" + id); // => one link per page
} // => end of startDiscoveredLinks

// => Rendering is a pure function of the id: same input, same HTML, and the
// => builder records which file each HTML came from.
function renderDetail(id: string): string {
  // => detail renderer
  return "<h1>" + id + "</h1>"; // => one HTML per id
} // => end of renderDetail

const nextPages = nextStaticParams(); // => the build list
console.log("next pages: " + nextPages.length); // => Output 3
for (const params of nextPages) {
  // => one HTML file per id
  console.log("next /products/" + params.id + " => " + renderDetail(params.id)); // => Output the HTML
} // => end of the Next.js loop
const startPages = startDiscoveredLinks(); // => the discovered links
console.log("start pages: " + startPages.length); // => Output 3
for (const link of startPages) {
  // => one HTML file per discovered link
  console.log("start " + link + " => " + renderDetail(link.split("/").pop() ?? "")); // => Output the HTML
} // => end of the Start loop
export {}; // => module scope keeps these names local
