// Worked Example 42: Search params schema.
// => NusaMart is fictional; every value here is fixed.
// => Search params are untrusted strings: page "two" is not 2, and a missing
// => sort is not an error. A schema parses each param once, applies defaults,
// => and collects every violation before the page decides anything.

// => Raw input: everything arrives as a string or not at all.
type Raw = Record<string, string | undefined>; // => untrusted input shape

// => Parsed output: page and limit are numbers, sort is a fixed union, and
// => violations name every param the input got wrong.
type Parsed = { page: number; limit: number; sort: "price" | "name"; errors: string[] }; // => trusted shape

// => Parse the shelf query: page defaults to 1, limit to 10 and clamps at
// => 50, sort defaults to price, and every violation is collected, not thrown.
function parseShelf(raw: Raw): Parsed {
  // => search params parser
  const errors: string[] = []; // => collected violations
  const page = raw.page === undefined ? 1 : Number(raw.page); // => default 1
  if (!Number.isInteger(page) || page < 1) {
    // => bad page
    errors.push("page must be a positive integer"); // => violation one
  } // => end of the page branch
  const limit = raw.limit === undefined ? 10 : Number(raw.limit); // => default 10
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    // => bad limit
    errors.push("limit must be 1 to 50"); // => violation two
  } // => end of the limit branch
  const sort = raw.sort ?? "price"; // => default price
  if (sort !== "price" && sort !== "name") {
    // => bad sort
    errors.push("sort must be price or name"); // => violation three
  } // => end of the sort branch
  return { page, limit, sort: sort === "name" ? "name" : "price", errors }; // => trusted output
} // => end of parseShelf

console.log(JSON.stringify(parseShelf({}))); // => Output defaults, no errors
console.log(JSON.stringify(parseShelf({ page: "2", sort: "name" }))); // => Output page 2, no errors
console.log(JSON.stringify(parseShelf({ page: "two", limit: "99", sort: "color" }))); // => Output three errors
export {}; // => module scope keeps these names local
