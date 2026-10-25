// Worked Example 9: Loading and error slots.
// => NusaMart is fictional; every state here is fixed.
// => A slow section should not blank the whole page, and a failed section
// => should not crash it: loading.tsx reserves a skeleton per segment and
// => error.tsx reserves a fallback per segment, in both frameworks' idiom.

// => The three states one product section can be in.
type SectionState = "loading" | "ready" | "failed"; // => skeleton, content, or fallback

// => Next.js file convention: loading.tsx renders while the segment loads,
// => error.tsx renders when the segment throws; siblings keep rendering.
function nextSection(state: SectionState): string {
  // => Next-style section slot
  if (state === "loading") {
    // => the skeleton branch
    return "skeleton: loading shelf..."; // => loading.tsx output
  } // => end of the skeleton branch
  if (state === "failed") {
    // => the fallback branch
    return "fallback: shelf unavailable, retry"; // => error.tsx output
  } // => end of the fallback branch
  return "shelf: Kopi Toraja 250g, Teh Melati 100g"; // => the loaded section
} // => end of nextSection

// => Start idiom: pendingComponent renders while the loader runs and
// => errorComponent renders when the loader rejects; siblings keep rendering.
function startSection(state: SectionState): string {
  // => Start-style section slot
  if (state === "loading") {
    // => the pending branch
    return "pending: loading shelf..."; // => pendingComponent output
  } // => end of the pending branch
  if (state === "failed") {
    // => the error branch
    return "error: shelf unavailable, retry"; // => errorComponent output
  } // => end of the error branch
  return "shelf: Kopi Toraja 250g, Teh Melati 100g"; // => the loaded section
} // => end of startSection

// => Every state renders something: the page never blanks and never crashes,
// => whichever dialect names the slots.
const states: SectionState[] = ["loading", "ready", "failed"]; // => all three states
for (const state of states) {
  // => each state through both dialects
  console.log("next " + state + " => " + nextSection(state)); // => Output the Next.js slot
  console.log("start " + state + " => " + startSection(state)); // => Output the Start slot
} // => end of the state loop
export {}; // => module scope keeps these names local
