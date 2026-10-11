// Example 11: Measuring INP on an Interaction. (co-08, co-10)
//
// Interaction to Next Paint (INP) measures RESPONSIVENESS: the latency from a user input (click,
// keypress) to the next painted frame. Good <= 200 ms; poor > 500 ms, at the 75th percentile.
//
// Note: INP good <= 200 ms / poor > 500 ms. INP replaced FID as a stable Core Web
// Vital on March 12, 2024. Source: web.dev, INP (https://web.dev/articles/inp).

// An interaction's latency is the sum of its processing + presentation delay + (input) delay.
interface Interaction {
  // => INP breaks latency into parts; the sum is what the user feels
  name: string; // => a label for the interaction (e.g. "click toggle")
  inputDelay: number; // => ms the main thread was busy before the event handler ran
  processing: number; // => ms the handler itself took
  presentationDelay: number; // => ms until the next frame painted
}

// The interactions observed during a page's life.
const interactions: Interaction[] = [
  // => a tight button click (fast) and a heavy sort (slow) -- INP is the WORST of them
  { name: "click toggle", inputDelay: 40, processing: 60, presentationDelay: 50 }, // => 150 ms total
  { name: "click sort", inputDelay: 180, processing: 220, presentationDelay: 120 }, // => 520 ms total
];

// inpOf sums the three parts; the page's INP is the WORST (max) interaction latency.
function inpOf(i: Interaction): number {
  // => all three phases happen between the input and the next paint, so they all count
  return i.inputDelay + i.processing + i.presentationDelay; // => the felt latency
}

const pageInp = Math.max(...interactions.map(inpOf)); // => INP = the worst interaction
const worst = interactions.find((i) => inpOf(i) === pageInp)!; // => which interaction was worst
const verdict = pageInp <= 200 ? "good" : pageInp > 500 ? "poor" : "needs improvement"; // => the web.dev bands

console.log("page INP (ms):", pageInp); // => Output: page INP (ms): 520
console.log("worst interaction:", worst.name); // => Output: worst interaction: click sort
console.log("rating:", verdict); // => Output: rating: poor
