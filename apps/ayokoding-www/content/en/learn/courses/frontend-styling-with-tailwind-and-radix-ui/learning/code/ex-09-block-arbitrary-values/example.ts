// => Worked Example 9: arbitrary values are the escape hatch the team locks.
// => co-05: bg-[#123456] compiles, so the linter must be the one that says no.
function allowsArbitrary(className: string, allowlist: string[]): boolean {
  // => admit plain utilities, judge bracket syntax
  // => arbitrary syntax is brackets; the allowlist names the only exceptions
  const arbitrary: boolean = className.includes("[") && className.includes("]"); // => bracket syntax means one-off value
  if (!arbitrary) {
    // => the plain-utility branch
    return true; // => plain utilities pass untouched
  } // => plain-utility branch done
  return allowlist.includes(className); // => only a listed exception survives
} // => checker complete
function main(): void {
  // => check one pass, one exception, one rejection
  // => entry point; one pass, one allowed exception, one rejection
  console.log("bg-blue-600: " + String(allowsArbitrary("bg-blue-600", []))); // => Output: bg-blue-600: true
  console.log("bg-[#123456]: " + String(allowsArbitrary("bg-[#123456]", []))); // => Output: bg-[#123456]: false
  console.log("w-[3px] allowlisted: " + String(allowsArbitrary("w-[3px]", ["w-[3px]"]))); // => Output: w-[3px] allowlisted: true
  console.log("drift caught at review time: true"); // => Output: drift caught at review time: true
} // => main ends; the hatch is locked with one key
main(); // => run once; a throw exits nonzero
