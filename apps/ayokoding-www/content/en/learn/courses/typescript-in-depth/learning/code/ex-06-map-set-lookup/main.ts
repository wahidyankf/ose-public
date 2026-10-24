// => Example 6: Map and Set make lookup and membership explicit.
const roles = new Map<string, string>([
  ["ada", "admin"],
  ["grace", "editor"],
]); // => name-to-role table
console.log(roles.get("ada") ?? "none"); // => Output: admin, present key
console.log(roles.get("alan") ?? "none"); // => Output: none, ?? covers absence
const seen = new Set<string>(); // => insertion-ordered membership ledger
for (const tag of ["ts", "js", "ts", "node", "js"]) {
  // => stream with repeats
  if (!seen.has(tag)) {
    // => WHY Set: O(1) membership, no indexOf scan
    seen.add(tag); // => first sighting recorded
    console.log("new:", tag); // => Output: new: ts, then js, then node
  } // => end of if (!seen.has(tag))
} // => end of for (const tag of ["ts", "js", "ts", "node", "js"])
console.log(seen.size); // => Output: 3, duplicates never stored
