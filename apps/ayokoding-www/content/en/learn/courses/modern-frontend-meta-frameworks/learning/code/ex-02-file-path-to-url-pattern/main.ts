// Worked Example 2: File path to URL pattern.
// => NusaMart is fictional; every product and price here is fixed.
// => Two frameworks, two filename dialects, one idea: the file's position in
// => the project decides the URL, and a marker decides which part is dynamic.
type Convention = "next" | "start"; // => the two filename dialects

// => One row of the mapping: the file on disk and the URL shape it owns.
type FileRoute = { file: string; pattern: string }; // => disk path plus URL shape

// => Next.js App Router files: page.tsx renders, brackets capture a segment.
const NEXT_FILES: FileRoute[] = [
  // => Next.js dialect rows
  { file: "app/page.tsx", pattern: "/" }, // => root file owns root URL
  { file: "app/products/page.tsx", pattern: "/products" }, // => folder owns list URL
  { file: "app/products/[id]/page.tsx", pattern: "/products/:id" }, // => brackets own detail
]; // => end of the Next.js rows

// => TanStack Start files: index.tsx renders a folder, dollar captures a segment.
const START_FILES: FileRoute[] = [
  // => Start dialect rows
  { file: "src/routes/index.tsx", pattern: "/" }, // => root file owns root URL
  { file: "src/routes/products/index.tsx", pattern: "/products" }, // => folder owns list URL
  { file: "src/routes/products/$productId.tsx", pattern: "/products/:productId" }, // => dollar owns detail
]; // => end of the Start rows

// => A URL pattern matches when every static segment is equal and every
// => dynamic segment (after the colon) accepts any single non-empty piece.
function matches(pattern: string, url: string): boolean {
  // => pattern matcher
  const want = pattern.split("/"); // => pattern pieces
  const got = url.split("/"); // => URL pieces
  if (want.length !== got.length) {
    // => different depth never matches
    return false; // => depth guards first
  } // => end of the depth guard
  return want.every((piece, i) => piece.startsWith(":") || piece === got[i]); // => colon means anything
} // => end of matches

// => Print one dialect's whole table, then prove two URLs against it.
function show(side: Convention, rows: FileRoute[]): void {
  // => dialect reporter
  for (const row of rows) {
    // => every file owns exactly one URL shape
    console.log(side + " " + row.file + " => " + row.pattern); // => Output the mapping row
  } // => end of the row loop
  console.log(side + " /products/teh-002 matches detail: " + matches(rows[2].pattern, "/products/teh-002")); // => Output true
  console.log(side + " /products matches detail: " + matches(rows[2].pattern, "/products")); // => Output false
} // => end of show

show("next", NEXT_FILES); // => Output the Next.js table plus two proofs
show("start", START_FILES); // => Output the Start table plus two proofs
export {}; // => module scope keeps these names local
