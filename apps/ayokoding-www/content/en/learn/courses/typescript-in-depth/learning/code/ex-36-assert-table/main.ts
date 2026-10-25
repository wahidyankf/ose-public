/// <reference path="./node.d.ts" />
// => Example 36: a table of cases plus strictEqual beats three copy-pasted tests.
import { strictEqual } from "node:assert/strict"; // => the standard assertions, inline runner
function slugify(raw: string): string {
  // => lowercase, trim, spaces to dashes
  return raw.trim().toLowerCase().replace(/\s+/g, "-"); // => the unit under test
} // => end of function slugify(raw: string): string
const cases: Array<[string, string]> = [
  // => WHY table: input plus expected per row
  ["  Hello World  ", "hello-world"], // => trims and dashes
  ["Ada", "ada"], // => lowercases
  ["a  b", "a-b"], // => collapses runs
]; // => end of the case table
let passed = 0; // => green counter
for (const [input, want] of cases) {
  // => every row runs the same check
  strictEqual(slugify(input), want); // => throws on the first mismatch
  passed += 1; // => only reached when the row passed
  console.log(`PASS: ${JSON.stringify(input)} -> ${want}`); // => Output: one PASS line per row
} // => end of for (const [input, want] of cases)
console.log(`passed: ${passed}/3`); // => Output: passed: 3/3
