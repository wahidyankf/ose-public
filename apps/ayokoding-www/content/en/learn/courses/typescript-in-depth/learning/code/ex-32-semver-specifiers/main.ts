// => Example 32: caret, tilde, and exact specifiers choose different update windows.
function allows(spec: string, version: string): boolean {
  // => tiny checker for ^, ~, and exact
  const [sMajor, sMinor] = spec.replace(/^[~^]/, "").split(".").map(Number); // => spec bounds parsed
  const [vMajor, vMinor] = version.split(".").map(Number); // => candidate parsed
  if (spec.startsWith("^")) {
    // => caret: same major, at least the minor
    return vMajor === sMajor && vMinor >= sMinor; // => major locked, minor floats up
  } // => end of if (spec.startsWith("^"))
  if (spec.startsWith("~")) {
    // => tilde: same major and minor
    return vMajor === sMajor && vMinor === sMinor; // => only patches float
  } // => end of if (spec.startsWith("~"))
  return spec === version; // => exact: byte-identical only
} // => end of function allows(spec: string, version: string): bool
console.log(allows("^1.2.0", "1.4.0"), allows("^1.2.0", "2.0.0")); // => Output: true false
console.log(allows("~1.2.0", "1.2.9"), allows("~1.2.0", "1.3.0")); // => Output: true false
console.log(allows("1.2.0", "1.2.0"), allows("1.2.0", "1.2.1")); // => Output: true false
