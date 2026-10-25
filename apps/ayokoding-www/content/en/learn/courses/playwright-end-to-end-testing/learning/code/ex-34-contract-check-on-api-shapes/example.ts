// Example 34: Contract Check on API Shapes. (co-14: api-testing)
// => Playwright 1.60.0, docs accessed 2026-10-20; an API test can assert
// => the response shape (required keys, value kinds), so a backend rename
// => breaks the contract test instead of silently emptying the UI. Shape
// => checks are cheaper than schema validators and catch the same renames:
// =>   real: expect(Object.keys(await res.json())).toEqual(["items", "total"]);
async function main(): Promise<void> {
  // => entry point for the contract check
  const good: Record<string, unknown> = { items: ["milk"], total: "$3.00" }; // => the backend keeps its promise
  const goodErrors: string[] = checkShape(good, ["items", "total"]); // => required keys present
  console.log("good errors: " + String(goodErrors.length)); // => Output: good errors: 0
  const renamed: Record<string, unknown> = { items: ["milk"], sum: "$3.00" }; // => backend renamed total to sum
  const badErrors: string[] = checkShape(renamed, ["items", "total"]); // => the contract names the missing key
  console.log("bad errors: " + badErrors.join(";")); // => Output: bad errors: missing key: total
  console.log("renamed field caught: " + String(badErrors.length === 1)); // => Output: renamed field caught: true
  const wrongKind: Record<string, unknown> = { items: "milk", total: "$3.00" }; // => items should be a list
  const kindErrors: string[] = checkShape(wrongKind, ["items", "total"]); // => kinds are checked too
  console.log("kind error: " + kindErrors.join(";")); // => Output: kind error: items is not a list
  console.log("contract holds: " + String(goodErrors.length === 0)); // => Output: contract holds: true
} // => main ends; renames fail loudly instead of emptying the UI

function checkShape(body: Record<string, unknown>, required: string[]): string[] {
  // => stand-in for shape assertions
  const errors: string[] = []; // => every violation lands here
  for (const key of required) {
    // => one check per required key
    if (!(key in body)) {
      // => the backend dropped or renamed the key
      errors.push("missing key: " + key); // => name the missing key exactly
    } // => presence checked
  } // => every required key checked
  if ("items" in body && !Array.isArray(body["items"])) {
    // => items must be a list when present
    errors.push("items is not a list"); // => a kind violation, not a missing key
  } // => kinds checked
  return errors; // => [] means the contract holds
} // => checkShape lists every violation at once

await main(); // => run once; a failure throws and exits nonzero
