// Worked Example 37: Section suspense states.
// => NusaMart is fictional; every section here is fixed.
// => A Suspense boundary lets each slow section load on its own clock: the
// => shell and the fast shelf render now, reviews show a fallback until
// => their data lands. One slow section no longer holds the page hostage.

// => The three sections and which ones are ready on first paint.
type Section = { name: string; ready: boolean; html: string }; // => section shape
const SECTIONS: Section[] = [
  // => fixed sections
  { name: "shell", ready: true, html: "<header>NusaMart</header>" }, // => always ready
  { name: "shelf", ready: true, html: "<ul><li>Kopi Toraja 250g</li></ul>" }, // => fast data
  { name: "reviews", ready: false, html: "<p>4.8 from 212 tasters</p>" }, // => slow data
]; // => end of the sections

// => Render with boundaries: ready sections show content, unready sections
// => show their own fallback while the rest of the page is already complete.
function firstPaint(): string[] {
  // => first paint
  return SECTIONS.map((s) => (s.ready ? s.name + ": " + s.html : s.name + ": loading reviews...")); // => per-section state
} // => end of firstPaint

// => Settle the slow section: its fallback swaps for content, and only its
// => boundary re-renders; the shell and shelf are untouched.
function settled(): string[] {
  // => settled paint
  return SECTIONS.map((s) => s.name + ": " + s.html); // => every section content
} // => end of settled

console.log("first: " + firstPaint().join(" | ")); // => Output shell, shelf, reviews fallback
console.log("settled: " + settled().join(" | ")); // => Output all three contents
export {}; // => module scope keeps these names local
