// Worked Example 47: Enhancement ladder.
// => NusaMart is fictional; every rung here is fixed.
// => Progressive enhancement is a ladder: plain HTML works everywhere, and
// => each rung adds capability without removing the rung below. JavaScript
// => failing still leaves a working shop, only a quieter one.

// => The four rungs: readable, navigable, submittable, delightful.
const RUNGS = [
  // => fixed ladder
  "html: shelf list readable with no JavaScript", // => rung one
  "links: detail pages reachable with no JavaScript", // => rung two
  "forms: add-to-cart posts with no JavaScript", // => rung three
  "islands: cart count updates without reloads, needs JavaScript", // => rung four
]; // => end of the ladder

// => Climb the ladder printing what each rung adds and what still works
// => when JavaScript is absent: the first three rungs survive, the fourth
// => degrades to the third instead of breaking.
for (let i = 0; i < RUNGS.length; i++) {
  // => each rung
  const worksWithoutJs = i < 3 ? "works without JS" : "needs JS, falls back to forms"; // => survival rule
  console.log("rung " + (i + 1) + ": " + RUNGS[i] + " [" + worksWithoutJs + "]"); // => Output the rung
} // => end of the rung loop
console.log("rungs without JS: 3 of 4"); // => Output the survival count
export {}; // => module scope keeps these names local
