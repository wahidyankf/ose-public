// => Example 69: a Set answers membership in O(1); includes scans the array.
const allowlist = new Set(["ada", "grace", "margaret"]); // => WHY Set: hashed membership
function viaSet(who: string): boolean {
  // => constant-time check
  return allowlist.has(who); // => hash lookup
} // => end of function viaSet(who: string): boolean
function viaScan(who: string): boolean {
  // => linear check for contrast
  return ["ada", "grace", "margaret"].includes(who); // => scans each element
} // => end of function viaScan(who: string): boolean
for (const who of ["ada", "alan"]) {
  // => one member, one stranger
  console.log(who, viaSet(who), viaScan(who)); // => Output: ada true true, then alan false false
} // => end of for (const who of ["ada", "alan"])
