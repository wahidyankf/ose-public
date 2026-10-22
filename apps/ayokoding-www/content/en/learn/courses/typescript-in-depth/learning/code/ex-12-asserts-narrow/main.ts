// => Example 12: assertion helpers turn validation into narrowing the compiler trusts.
function assertDefined<T>(value: T | undefined, field: string): asserts value is T {
  // => WHY asserts: success narrows
  if (value === undefined) {
    // => the absence case throws
    throw new Error(`missing: ${field}`); // => names the absent field
  } // => end of if (value === undefined)
} // => end of function assertDefined<T>(value: T | undefined, fiel
function start(host: string | undefined, port: number | undefined): string {
  // => raw optional config
  assertDefined(host, "host"); // => host narrows to string below
  assertDefined(port, "port"); // => port narrows to number below
  return `${host}:${port}`; // => both known present: template is safe
} // => end of function start(host: string | undefined, port: numbe
console.log(start("localhost", 3101)); // => Output: localhost:3101
try {
  // => the missing-host case below
  start(undefined, 3101); // => host absent: the assertion must throw
} catch (err) {
  // => report the assertion failure
  console.log("failed:", err instanceof Error ? err.message : err); // => Output: failed: missing: host
} // => end of catch (err)
