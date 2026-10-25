// => Worked Example 2: objects nest, so schemas nest too.
// => co-01: in Zod this is z.object({ address: z.object({ city: z.string() }) }).
interface Issue {
  // => one validation failure with its full nested path
  path: string; // => dotted key path, e.g. "address.zip"
  message: string; // => why it failed at that path
}
function isRecord(value: unknown): value is Record<string, unknown> {
  // => narrow unknown to an object before reading keys from it
  return typeof value === "object" && value !== null; // => objects only; null is excluded
}
function checkString(record: Record<string, unknown>, path: string, key: string): Issue | null {
  // => check one string leaf and report its full dotted path
  const value: unknown = record[key]; // => read the leaf out of its parent object
  if (typeof value !== "string" || value.length === 0) {
    // => empty strings fail too: a present-but-blank city is not a city
    return { path: path + "." + key, message: "expected non-empty string" }; // => failure names the leaf
  } // => leaf valid: fall through
  return null; // => no issue at this path
}
function main(): void {
  // => entry point; nested input is checked level by level
  // => a fully valid nested payload passes every level
  const good: unknown = { name: "Ada", address: { city: "Surabaya", zip: "60111" } }; // => two levels, all strings
  const goodIssues: Issue[] = []; // => collect failures across levels here
  if (isRecord(good) && isRecord(good["address"])) {
    // => narrow both levels before touching leaves
    const address: Record<string, unknown> = good["address"]; // => the nested object under test
    const cityIssue: Issue | null = checkString(address, "address", "city"); // => check the city leaf
    if (cityIssue !== null) {
      // => only failures are recorded
      goodIssues.push(cityIssue); // => record the city failure, if any
    } // => city done
    const zipIssue: Issue | null = checkString(address, "address", "zip"); // => check the zip leaf
    if (zipIssue !== null) {
      // => only failures are recorded
      goodIssues.push(zipIssue); // => record the zip failure, if any
    } // => zip done
  } // => both levels checked
  console.log("valid: ok=" + String(goodIssues.length === 0)); // => Output: valid: ok=true
  // => a blank nested leaf fails with its full dotted path
  const bad: unknown = { name: "Ada", address: { city: "", zip: "60111" } }; // => city blank, zip fine
  const badIssues: Issue[] = []; // => fresh collector for the bad payload
  if (isRecord(bad) && isRecord(bad["address"])) {
    // => same narrowing, hostile payload
    const badAddress: Record<string, unknown> = bad["address"]; // => the nested object under test
    const badCity: Issue | null = checkString(badAddress, "address", "city"); // => the blank leaf fails here
    if (badCity !== null) {
      // => the failure is real, so record it
      badIssues.push(badCity); // => path reads "address.city", not just "city"
    } // => city done
  } // => narrowing done
  console.log("invalid: issues=" + String(badIssues.length) + " first=" + badIssues[0].path); // => Output: invalid: issues=1 first=address.city
}
main(); // => run once; a throw exits nonzero
