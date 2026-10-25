// => Example 19: matchAll plus named groups parse repeated structure.
const line = "ada:9, grace:10, alan:7"; // => repeated name-score pairs
const re = /(?<who>[a-z]+):(?<score>\d+)/g; // => WHY named groups: fields by name, not index
const pairs: string[] = []; // => collected readable pairs
for (const m of line.matchAll(re)) {
  // => every non-overlapping match in order
  pairs.push(`${m.groups?.who ?? "?"}=${m.groups?.score ?? "?"}`); // => named fields, guarded
} // => end of for (const m of line.matchAll(re))
console.log(pairs.join(" ")); // => Output: ada=9 grace=10 alan=7
console.log("call 3101 now".replace(/\d+/, "#")); // => Output: call # now, first digit run only
