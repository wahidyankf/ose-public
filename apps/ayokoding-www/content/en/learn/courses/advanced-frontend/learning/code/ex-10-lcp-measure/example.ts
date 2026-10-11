// Example 10: Measuring LCP and Finding the LCP Element. (co-08, co-09)
//
// Largest Contentful Paint (LCP) measures loading: the time of the largest text block or image
// that paints. The "LCP element" is whichever element won that race. Good <= 2.5 s; poor > 4.0 s,
// at the 75th percentile over a rolling 28-day CrUX window.
//
// Note: LCP good <= 2.5 s / poor > 4.0 s, at the 75th percentile. Source:
// web.dev, LCP (https://web.dev/articles/lcp).

// Each "paint entry" the browser would report: an element and when it painted (ms).
interface PaintEntry {
  // => stands in for the PerformanceObserver `largest-contentful-paint` entries
  element: string; // => a CSS-like selector naming what painted
  time: number; // => milliseconds from navigation start to the paint
}

// The raw paint entries this simulated page produced, in arrival order.
const entries: PaintEntry[] = [
  // => small elements paint early; the hero image is largest but arrives latest
  { element: "span.badge", time: 400 }, // => a small badge paints first
  { element: "h1.title", time: 900 }, // => the title paints next
  { element: "img.hero", time: 2600 }, // => the hero image is largest and slowest -> it is the LCP
];

// computeLCP returns the entry with the LARGEST paint time -- the last big thing to paint.
function computeLCP(all: PaintEntry[]): PaintEntry {
  // => LCP is defined as the maximum render time of the largest contentful element
  return all.reduce((max, e) => (e.time > max.time ? e : max)); // => pick the latest-painting entry
}

const lcp = computeLCP(entries); // => the hero image wins the LCP race
const verdict = lcp.time <= 2500 ? "good" : lcp.time > 4000 ? "poor" : "needs improvement"; // => the web.dev bands

console.log("LCP element:", lcp.element); // => Output: LCP element: img.hero
console.log("LCP time (ms):", lcp.time); // => Output: LCP time (ms): 2600
console.log("rating:", verdict); // => Output: rating: needs improvement
