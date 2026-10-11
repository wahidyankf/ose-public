// Example 14: Render Blocking CSS Delays First Paint. (co-12)
//
// CSS is a RENDER-BLOCKING resource: the browser will not paint ANY content until the CSSOM is
// built. Both the DOM AND the CSSOM are required to construct the render tree, so a large
// blocking stylesheet delays first paint by however long it takes to download and parse.
//
// Note: "CSS is treated as a render-blocking resource ... the browser won't render
// any content until the CSSOM is constructed"; "both the DOM and the CSSOM are required to
// construct the render tree." Source: web.dev, render-blocking CSS
// (https://web.dev/articles/critical-rendering-path/render-blocking-css).

// A timeline is a sequence of (event, time-in-ms) pairs the browser would log.
interface Step {
  // => each milestone in the critical rendering path
  event: string; // => what happened
  time: number; // => when, in ms from navigation start
}

// WITHOUT inlining: a 200ms external stylesheet blocks first paint until it finishes.
const externalCss: Step[] = [
  // => the browser cannot build the render tree until the CSSOM is ready
  { event: "HTML parsed", time: 50 }, // => DOM ready
  { event: "CSSOM ready (external)", time: 250 }, // => render tree CANNOT be built until now
  { event: "first paint", time: 260 }, // => co-12: paint is gated on the CSSOM
];

// firstPaintAfter returns the time of the first paint step in a timeline.
function firstPaintAfter(timeline: Step[]): number {
  // => find the "first paint" milestone the browser reports
  return timeline.find((s) => s.event.includes("first paint"))!.time; // => the gating effect, measured
}

console.log("first paint with blocking external CSS (ms):", firstPaintAfter(externalCss)); // => Output: 260
