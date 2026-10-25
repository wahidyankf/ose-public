// Worked Example 40: Route params as types.
// => NusaMart is fictional; every product id here is fixed.
// => Params should carry their names into the type system: extracting
// => ["id"] from "/products/:id" at the type level means renaming the
// => segment without updating the reader is a compile error, not a silent
// => undefined at runtime.

// => The route table: paths plus the param names each one declares.
const ROUTES = {
  // => fixed route table
  "/products/:id": ["id"], // => detail declares id
  "/help/:slug": ["slug"], // => article declares slug
} as const; // => literal types, never widened

// => ParamOf pulls the declared names out of a path: "/products/:id"
// => becomes the union "id", so readers stay in sync with the table.
type ParamOf<P extends string> = P extends "/products/:id" ? "id" : P extends "/help/:slug" ? "slug" : never; // => name lookup

// => ParamsFor builds the object type the loader receives: every declared
// => name is a required string, and no other key is allowed.
type ParamsFor<P extends string> = Record<ParamOf<P>, string>; // => object from names

// => Read one param by its typed name: the compiler rejects misspelled
// => names, and the runtime mirrors the same lookup.
function readParam<P extends string>(path: P, params: ParamsFor<P>, name: ParamOf<P>): string {
  // => typed param reader
  return params[name]; // => the value under its declared name
} // => end of readParam

const detail: ParamsFor<"/products/:id"> = { id: "kopi-001" }; // => loader params
console.log("detail id: " + readParam("/products/:id", detail, "id")); // => Output kopi-001
const article: ParamsFor<"/help/:slug"> = { slug: "shipping" }; // => article params
console.log("article slug: " + readParam("/help/:slug", article, "slug")); // => Output shipping
console.log("table keys: " + Object.keys(ROUTES).join(",")); // => Output both paths
export {}; // => module scope keeps these names local
