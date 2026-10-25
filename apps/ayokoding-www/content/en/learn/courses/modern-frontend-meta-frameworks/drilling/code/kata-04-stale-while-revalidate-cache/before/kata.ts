// Kata 04 starter: a shelf that re-renders on every visit.
// => NusaMart is fictional; the rows here are fixed.
// => TODO: cache the render for 60 ticks and rebuild only when stale, so
// => repeat visits replay instead of re-rendering. See Example 19.
let renders = 0; // => render counter
function shelf(): string {
  // => always renders
  renders += 1; // => count this render
  return "<ul><li>Kopi Toraja 250g</li></ul>"; // => fixed shelf HTML
} // => end of shelf
console.log(shelf() + " renders=" + renders); // => Output render one
console.log(shelf() + " renders=" + renders); // => Output render two: fix this
export {}; // => module scope keeps these names local
