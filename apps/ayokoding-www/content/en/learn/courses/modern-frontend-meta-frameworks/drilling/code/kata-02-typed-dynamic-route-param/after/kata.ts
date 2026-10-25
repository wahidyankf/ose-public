// Kata 02 solution: a detail link the compiler checks.
// => NusaMart is fictional; every product id here is fixed.
// => The route table is a type: buildPath only accepts its keys, so a
// => misspelled path or a missing id breaks the build, never a visitor.
const ROUTES = { "/": [], "/products": [], "/products/:id": ["id"] } as const; // => fixed table
type RoutePath = keyof typeof ROUTES; // => the legal path union
function buildPath(path: RoutePath, params: Record<string, string> = {}): string {
  // => typed link builder
  let built: string = path; // => the growing URL
  for (const [key, value] of Object.entries(params)) {
    // => every supplied param
    built = built.replace(":" + key, value); // => fill its hole
  } // => end of the param loop
  return built; // => the finished URL
} // => end of buildPath
console.log("link: " + buildPath("/products/:id", { id: "kopi-001" })); // => Output the checked link
console.log("link: " + buildPath("/products/:id", { id: "teh-002" })); // => Output the checked link
export {}; // => module scope keeps these names local
