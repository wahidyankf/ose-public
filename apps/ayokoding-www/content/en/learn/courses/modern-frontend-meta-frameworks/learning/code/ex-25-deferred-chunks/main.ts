// Worked Example 25: Deferred chunks.
// => NusaMart is fictional; every chunk here is fixed.
// => Not all data deserves to block the page: the product shell renders
// => now, reviews stream in later. Deferred values split one loader into
// => critical data plus promises the page awaits independently.

// => The loader returns the critical row plus a deferred reviews promise,
// => modelled here as a tagged chunk list in arrival order.
type Chunk = { kind: "shell" | "reviews"; body: string }; // => chunk shape

// => Critical data first: name and price render with the shell.
function shellChunk(): Chunk {
  // => shell builder
  return { kind: "shell", body: "<h1>Kopi Toraja 250g 68000</h1>" }; // => critical HTML
} // => end of shellChunk

// => Deferred data later: reviews resolve after the shell is already up.
function reviewsChunk(): Chunk {
  // => reviews builder
  return { kind: "reviews", body: "<p>4.8 from 212 tasters</p>" }; // => late HTML
} // => end of reviewsChunk

// => The stream order is the lesson: shell, then reviews, never reversed,
// => and the shell alone is already a complete, readable page.
const stream: Chunk[] = [shellChunk(), reviewsChunk()]; // => arrival order
for (const chunk of stream) {
  // => each chunk as it arrives
  console.log(chunk.kind + ": " + chunk.body); // => Output the chunk
} // => end of the chunk loop
console.log("shell alone readable: " + stream[0].body.includes("Kopi")); // => Output true
export {}; // => module scope keeps these names local
