// => Example 67: unknown plus narrowing replaces any; the compiler guards every use.
function areaOf(raw: unknown): number {
  // => WHY unknown: honest about ignorance
  if (typeof raw === "object" && raw !== null && "r" in raw) {
    // => shape gate
    const { r } = raw as { r: unknown }; // => pull the field loosely
    if (typeof r === "number") {
      // => narrow the field
      return Math.PI * r * r; // => safe arithmetic
    } // => end of if (typeof r === "number")
  } // => end of if (typeof raw === "object" && raw !== null && "r" i
  throw new Error("need { r: number }"); // => rejection names the shape
} // => end of function areaOf(raw: unknown): number
console.log(areaOf({ r: 2 }).toFixed(2)); // => Output: 12.57
try {
  // => the unshaped payload below
  areaOf(42); // => a bare number has no r
} catch (err) {
  // => report the boundary rejection
  console.log("rejected:", err instanceof Error ? err.message : err); // => Output: rejected: need { r: number }
} // => end of catch (err)
