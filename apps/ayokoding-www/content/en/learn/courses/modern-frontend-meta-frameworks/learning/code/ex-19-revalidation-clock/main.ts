// Worked Example 19: Revalidation clock.
// => NusaMart is fictional; every price and tick here is fixed.
// => Revalidation replays saved HTML until its age passes a limit, then
// => rebuilds once and serves fresh. The clock is logical ticks, never the
// => wall clock, so the transcript is byte-identical on every run.

// => Saved page plus the tick it was built at; the limit is 60 ticks.
let savedHtml = "<p>Teh 32000</p>"; // => the cached page
let builtAt = 0; // => the build tick
const LIMIT = 60; // => revalidate interval in ticks

// => One request at one tick: fresh while young, rebuilt once stale, and
// => the rebuild moves the build tick so the next request is fresh again.
function request(now: number, freshHtml: string): string {
  // => revalidation decision
  if (now - builtAt <= LIMIT) {
    // => within the limit
    return "serve saved (age " + (now - builtAt) + ")"; // => replay the cache
  } // => end of the fresh branch
  savedHtml = freshHtml; // => rebuild with current data
  builtAt = now; // => the rebuild becomes the new baseline
  return "rebuilt at " + now + ": " + savedHtml; // => fresh page after rebuild
} // => end of request

console.log("t10: " + request(10, "<p>Teh 33000</p>")); // => Output serve saved (age 10)
console.log("t70: " + request(70, "<p>Teh 33000</p>")); // => Output rebuilt at 70
console.log("t80: " + request(80, "<p>Teh 34000</p>")); // => Output serve saved (age 10)
export {}; // => module scope keeps these names local
