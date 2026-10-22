// => Example 14: guard clauses return early; the happy path stays flat.
function nicknameOf(raw: string | null): string {
  // => nullable input, plain output
  if (raw === null) {
    // => WHY early: absence exits before any work
    return "anonymous"; // => one-line absence policy
  } // => end of if (raw === null)
  const trimmed = raw.trim(); // => whitespace never reaches the result
  if (trimmed === "") {
    // => second guard: blank is absence too
    return "anonymous"; // => same policy, stated once more
  } // => end of if (trimmed === "")
  return trimmed.toLowerCase(); // => happy path: flat, last, obvious
} // => end of function nicknameOf(raw: string | null): string
for (const probe of [null, "   ", "  Ada  "]) {
  // => absent, blank, and padded inputs
  console.log(JSON.stringify(probe), "->", nicknameOf(probe)); // => Output: null -> anonymous, then blank, then ada
} // => end of for (const probe of [null, " ", " Ada "])
