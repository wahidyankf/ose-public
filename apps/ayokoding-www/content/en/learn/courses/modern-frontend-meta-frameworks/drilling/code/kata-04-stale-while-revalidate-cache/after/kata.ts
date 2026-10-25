// Kata 04 solution: a shelf that replays while fresh and rebuilds stale.
// => NusaMart is fictional; every row and tick here is fixed.
// => The saved HTML serves every visit inside the 60-tick limit; the first
// => visit past the limit rebuilds once and resets the baseline.
let saved = ""; // => the cached shelf HTML
let builtAt = 0; // => the build tick
let renders = 0; // => render counter
const LIMIT = 60; // => revalidate interval in ticks
function shelf(now: number): string {
  // => cached shelf
  if (saved !== "" && now - builtAt <= LIMIT) {
    // => fresh cache
    return saved + " renders=" + renders; // => replay, no render
  } // => end of the fresh branch
  renders += 1; // => count the rebuild
  saved = "<ul><li>Kopi Toraja 250g</li></ul>"; // => rebuild the HTML
  builtAt = now; // => reset the baseline
  return saved + " renders=" + renders; // => fresh page
} // => end of shelf
console.log("t10: " + shelf(10)); // => Output replay-free first build, renders=1
console.log("t20: " + shelf(20)); // => Output replay, renders still 1
console.log("t90: " + shelf(90)); // => Output rebuild, renders=2
export {}; // => module scope keeps these names local
