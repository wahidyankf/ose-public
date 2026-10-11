// Example 60: Suspense Does Not Detect a useEffect Fetch. (co-30)
//
// The trap: a fetch kicked off inside a useEffect does NOT trigger a <Suspense> boundary.
// Suspense only suspends on `use()` of a promise, lazy code, or a framework integration -- a fetch
// started in an effect is invisible to Suspense, so the fallback NEVER shows for it.
//
// Note: "Suspense does not detect when data is fetched inside an Effect or event
// handler." Source: react.dev, <Suspense> (https://react.dev/reference/react/Suspense).

// Tracks whether the <Suspense> fallback ever rendered for this fetch.
let fallbackShown = false; // => stays false -- the effect-fetch never triggers the boundary
// => this is the bug: the developer EXPECTED a loading state and got none

// An effect-based fetch: starts in useEffect, stores result in state. Suspense is uninvolved.
function effectFetchRender(state: "loading" | "done"): string {
  // => the effect started the fetch; the component manages its OWN loading state, not Suspense
  if (state === "loading") return "<p>my own loading state</p>"; // => hand-rolled, not the Suspense fallback
  return "<p>data</p>"; // => the resolved content
}

// simulateSuspenseBoundary checks whether anything SUSPENDED during this render.
function simulateSuspenseBoundary(render: () => string): { fallbackShown: boolean; content: string } {
  // => co-30: the boundary only reacts to a THROWN promise; the effect fetch throws nothing
  fallbackShown = false; // => reset; the effect fetch never throws a promise
  const content = render(); // => no throw -> no fallback -> content (or hand-rolled state) renders
  return { fallbackShown, content }; // => fallbackShown stays false
}

// During the effect-fetch's loading phase, the Suspense fallback is NEVER shown.
const loading = simulateSuspenseBoundary(() => effectFetchRender("loading")); // => no suspension

console.log("Suspense fallback shown during effect-fetch:", loading.fallbackShown); // => Output: ...shown: false
console.log("rendered instead:", loading.content); // => Output: rendered instead: <p>my own loading state</p>
