// => Kata 4 solution: unknown forces the shape gate; misuse is rejected, not crashed.
function areaOf(raw: unknown): number {
  // => honest signature
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
console.log(areaOf({ r: 1 }).toFixed(2)); // => Output: 3.14
try {
  // => the unshaped payload below
  areaOf({ r: "big" }); // => string radius must fail
} catch (err) {
  // => report the boundary rejection
  console.log("rejected:", err instanceof Error ? err.message : err); // => Output: rejected: need { r: number }
} // => end of catch (err)
