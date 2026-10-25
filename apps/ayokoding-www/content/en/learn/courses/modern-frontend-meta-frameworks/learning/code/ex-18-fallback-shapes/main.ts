// Worked Example 18: Fallback shapes.
// => NusaMart is fictional; every product id here is fixed.
// => A new product can appear after the build: blocking waits for its HTML,
// => true serves a shell first and swaps in the page, false 404s anything
// => unbuilt. The choice is a latency-versus-correctness trade, not a default.

// => Ids the build knew about; susu-009 arrived after the build finished.
const BUILT = ["kopi-001", "teh-002", "gula-003"]; // => frozen build list
const LATE_ID = "susu-009"; // => the after-build arrival

// => The three fallback shapes as one decision function: given the mode and
// => the id, name what the visitor sees first.
function fallback(mode: "blocking" | "true" | "false", id: string): string {
  // => fallback decision
  if (BUILT.includes(id)) {
    // => built ids always serve saved HTML
    return "serve built HTML"; // => no fallback involved
  } // => end of the built branch
  if (mode === "blocking") {
    // => wait, then serve the fresh HTML
    return "wait then serve fresh HTML for " + id; // => slow but complete
  } // => end of the blocking branch
  if (mode === "true") {
    // => shell now, page when ready
    return "serve shell, swap in " + id + " later"; // => fast but partial
  } // => end of the true branch
  return "404 for " + id; // => false: unbuilt means missing
} // => end of fallback

// => The late arrival exercises all three modes; the built id never does.
const modes: ("blocking" | "true" | "false")[] = ["blocking", "true", "false"]; // => all three modes
for (const mode of modes) {
  // => each mode against the late id
  console.log(mode + " late => " + fallback(mode, LATE_ID)); // => Output the late behavior
} // => end of the mode loop
console.log("blocking built => " + fallback("blocking", "kopi-001")); // => Output serve built HTML
export {}; // => module scope keeps these names local
