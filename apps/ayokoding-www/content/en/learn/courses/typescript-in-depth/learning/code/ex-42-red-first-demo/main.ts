/// <reference path="./node.d.ts" />
// => Example 42: RED first, then GREEN: the wish fails against the stub, holds on the fix.
import { strictEqual } from "node:assert/strict"; // => wish stated as assertions
function brokenTotal(lines: Array<{ qty: number }>): number {
  // => first attempt: counts lines, not qty
  return lines.length; // => wrong: two lines are not five items
} // => end of function brokenTotal(lines: Array<{ qty: number }>):
function totalQty(lines: Array<{ qty: number }>): number {
  // => the fix: sums quantities
  return lines.reduce((n, l) => n + l.qty, 0); // => every line contributes its qty
} // => end of function totalQty(lines: Array<{ qty: number }>): nu
const lines = [{ qty: 2 }, { qty: 3 }]; // => fixed fixture
try {
  // => RED: the wish against the broken attempt
  strictEqual(brokenTotal(lines), 5); // => must throw: 2 is not 5
  console.log("red: unexpected pass"); // => unreachable while the wish is honest
} catch {
  // => the RED transcript, kept as data
  console.log("red: wish failed as expected"); // => Output: red: wish failed as expected
} // => end of catch
strictEqual(totalQty(lines), 5); // => GREEN: the wish now holds
console.log("green: wish holds"); // => Output: green: wish holds
