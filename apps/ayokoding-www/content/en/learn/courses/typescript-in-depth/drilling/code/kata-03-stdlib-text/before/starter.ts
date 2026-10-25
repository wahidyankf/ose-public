// => Kata 3 starter: hand-rolled query parsing that breaks on encoded values.
export function getTag(query: string): string {
  // => BUG: splits on every ampersand
  const pairs = query.split("&"); // => breaks when a value holds an encoded &
  for (const pair of pairs) {
    // => scan pairs
    const [k, v] = pair.split("="); // => split key from value
    if (k === "tag") {
      // => wanted key
      return decodeURIComponent(v ?? ""); // => decode comes too late for split damage
    } // => end of if (k === "tag")
  } // => end of for (const pair of pairs)
  return ""; // => missing tag
} // => end of export function getTag(query: string): string
