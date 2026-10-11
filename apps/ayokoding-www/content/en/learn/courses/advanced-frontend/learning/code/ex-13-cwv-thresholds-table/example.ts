// Example 13: The Core Web Vitals Good and Poor Thresholds. (co-08)
//
// The Core Web Vitals triad is LCP (loading), INP (responsiveness), and CLS (visual stability).
// INP REPLACED FID as a stable Core Web Vital on March 12, 2024 -- this table is the current
// (2026) triad, not the older LCP/FID/CLS set. All thresholds are at the 75th percentile over a
// rolling 28-day CrUX window.
//
// Note: INP replaced FID on March 12, 2024
// (https://web.dev/blog/inp-cwv-launch). LCP/INP/CLS thresholds from web.dev.

// Each vital has a name, a unit, and the good / poor band boundaries.
interface Vital {
  // => the three numbers that define a vital's good-vs-poor rating
  name: string; // => the vital's acronym
  unit: string; // => the measurement unit
  good: number; // => at or below this is "good"
  poor: number; // => above this is "poor"
}

const VITALS: Vital[] = [
  // => co-08: the current triad -- note INP, not the retired FID
  { name: "LCP", unit: "ms", good: 2500, poor: 4000 }, // => loading
  { name: "INP", unit: "ms", good: 200, poor: 500 }, // => responsiveness (replaced FID)
  { name: "CLS", unit: "score", good: 0.1, poor: 0.25 }, // => visual stability (unitless score)
];

// rating classifies a measured value into the good / needs-improvement / poor band.
function rating(v: Vital, measured: number): string {
  // => the bands are: <= good -> good, > poor -> poor, in between -> needs improvement
  if (measured <= v.good) return "good"; // => meets the target
  if (measured > v.poor) return "poor"; // => failing
  return "needs improvement"; // => the middle band
}

console.log("Vital | good | poor | unit");
for (const v of VITALS) {
  // => print the threshold table exactly as web.dev states it
  console.log(`${v.name} | <= ${v.good} | > ${v.poor} | ${v.unit}`); // => one row per vital
}

// Sanity-check the classifier against the capstone's measured triad (Example 80).
console.log("a 220ms INP is rated:", rating(VITALS[1], 220)); // => Output: a 220ms INP is rated: needs improvement
