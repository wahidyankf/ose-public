// Worked Example 36: Streamed chunks in order.
// => NusaMart is fictional; every chunk here is fixed.
// => Streaming sends the page in pieces: the shell first, the shelf next,
// => the reviews last. Each chunk is usable HTML on arrival, and the order
// => is a contract: shell, then sections slowest-last.

// => The three chunks in stream order: shell, shelf, reviews.
const CHUNKS = [
  // => fixed chunk list
  "<header>NusaMart</header>", // => shell, usable instantly
  "<ul><li>Kopi Toraja 250g</li></ul>", // => fast section
  "<p>4.8 from 212 tasters</p>", // => slow section, last
]; // => end of the chunk list

// => Stream the page: print each chunk as it arrives and the running total,
// => so the transcript shows progressive completion, not one late blob.
let assembled = ""; // => the page so far
for (const chunk of CHUNKS) {
  // => each chunk in order
  assembled += chunk; // => append to the page
  console.log("chunk: " + chunk); // => Output the arriving chunk
} // => end of the chunk loop
console.log("assembled: " + assembled); // => Output the complete page
export {}; // => module scope keeps these names local
