// => Example 9: catch holds unknown; narrowing decides what the failure was.
function parseCount(raw: string): number {
  // => strict JSON number parsing
  const value: unknown = JSON.parse(raw); // => WHY unknown: JSON promises nothing
  if (typeof value !== "number") {
    // => narrow before trusting the shape
    throw new Error(`not a number: ${raw}`); // => precise failure, raw echoed
  } // => end of if (typeof value !== "number")
  return value; // => narrowed to number here
} // => end of function parseCount(raw: string): number
for (const raw of ["42", '"oops"']) {
  // => one valid payload, one wrong shape
  try {
    // => narrow block: only the risky parse lives here
    console.log("count:", parseCount(raw)); // => Output: count: 42, once
  } catch (err) {
    // => WHY unknown: throwers promise no type
    console.log("failed:", err instanceof Error ? err.message : String(err)); // => Output: failed: not a number
  } // => end of catch (err)
} // => end of for (const raw of ["42", '"oops"'])
