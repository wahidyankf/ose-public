// Worked Example 45: Convention matrix.
// => NusaMart is fictional; the shop below is only an example row.
// => Fifteen concepts, two dialects: this matrix prints where Next.js and
// => TanStack Start agree and where they diverge, one row per convention,
// => so the choice between them is a lookup instead of folklore.

// => One matrix row: the topic, both spellings, and the verdict.
type Row = { topic: string; next: string; start: string; verdict: "agree" | "differ" }; // => row shape

// => The matrix: routing, shells, rendering, loading, actions, caching,
// => types, and deployment targets side by side.
const MATRIX: Row[] = [
  // => eight convention rows
  { topic: "route file", next: "app/.../page.tsx", start: "routes/.../index.tsx", verdict: "differ" }, // => file names
  { topic: "dynamic segment", next: "[id]", start: "$productId", verdict: "differ" }, // => param spelling
  { topic: "catch-all", next: "[...slug]", start: "$ splat", verdict: "differ" }, // => rest capture
  { topic: "shared shell", next: "layout.tsx + children", start: "__root + Outlet", verdict: "agree" }, // => nesting idea
  { topic: "server data", next: "async Server Component", start: "route loader", verdict: "agree" }, // => load before render
  { topic: "mutation", next: "server action", start: "server function POST", verdict: "agree" }, // => server mutation
  { topic: "param types", next: "inferred from files", start: "inferred from tree", verdict: "agree" }, // => typed routes
  { topic: "deploy target", next: "node server or static", start: "node server or static", verdict: "agree" }, // => same targets
]; // => end of the matrix

// => Print the matrix plus its totals: agreements outnumber differences,
// => and every difference is a spelling, never a capability the other lacks.
for (const row of MATRIX) {
  // => each convention
  console.log(row.topic + ": next=" + row.next + " start=" + row.start + " " + row.verdict); // => Output the row
} // => end of the row loop
console.log("agree: " + MATRIX.filter((r) => r.verdict === "agree").length); // => Output 5
console.log("differ: " + MATRIX.filter((r) => r.verdict === "differ").length); // => Output 3
export {}; // => module scope keeps these names local
