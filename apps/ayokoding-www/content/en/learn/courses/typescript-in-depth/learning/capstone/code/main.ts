/// <reference path="./node.d.ts" />
// => Capstone file 1: report-cli reads orders, validates rows, totals, and writes a report.
import { readFileSync, writeFileSync } from "node:fs"; // => input read plus report write
import { join } from "node:path"; // => portable scratch path
import { tmpdir } from "node:os"; // => writable scratch root
import { strictEqual, deepStrictEqual } from "node:assert/strict"; // => embedded selftests
type Result<T> = { ok: true; value: T } | { ok: false; error: string }; // => outcome union
interface Line {
  // => one validated order line
  item: string; // => product name
  qty: number; // => units, at least one
  price: number; // => unit price, finite
} // => end of interface Line
function parseLine(raw: string): Result<Line> {
  // => WHY Result: bad rows skip, never crash
  const [item, qtyRaw, priceRaw] = raw.split(","); // => three columns
  const qty = Number(qtyRaw); // => coerce once
  const price = Number(priceRaw); // => coerce once
  if (item.trim() === "") {
    // => name policy
    return { ok: false, error: `blank item in: ${raw}` }; // => failure as data
  } // => end of if (item.trim() === "")
  if (!Number.isInteger(qty) || qty < 1) {
    // => quantity policy
    return { ok: false, error: `bad qty in: ${raw}` }; // => failure as data
  } // => end of if (!Number.isInteger(qty) || qty < 1)
  if (!Number.isFinite(price) || price < 0) {
    // => price policy
    return { ok: false, error: `bad price in: ${raw}` }; // => failure as data
  } // => end of if (!Number.isFinite(price) || price < 0)
  return { ok: true, value: { item: item.trim(), qty, price } }; // => trusted line out
} // => end of function parseLine(raw: string): Result<Line>
function lineTotal(line: Line): number {
  // => one line's contribution
  return line.qty * line.price; // => units times price
} // => end of function lineTotal(line: Line): number
function selftest(): void {
  // => WHY embedded: the standard asserts gate the release
  const one = parseLine("lamp,2,25"); // => valid fixture row
  strictEqual(one.ok && one.value.qty, 2); // => qty parsed
  const bad = parseLine("pen,0,3"); // => zero-qty row
  strictEqual(bad.ok, false); // => rejected as data, not thrown
  strictEqual(lineTotal({ item: "lamp", qty: 2, price: 25 }), 50); // => line math
  deepStrictEqual(
    [1, 2].map((n) => n * 2),
    [2, 4],
  ); // => runner sanity
  console.log("selftest: 4/4 passed"); // => Output: selftest: 4/4 passed
} // => end of function selftest(): void
function main(): void {
  // => read, validate, total, write, report
  selftest(); // => gate first: no report on red
  const rows = readFileSync("orders.csv", "utf-8")
    .split("\n")
    .slice(1)
    .filter((l) => l.trim() !== ""); // => fixture rows
  const kept: Line[] = []; // => validated lines
  let skipped = 0; // => rejected rows
  for (const raw of rows) {
    // => validate every row
    const out = parseLine(raw); // => failure as data
    if (out.ok) {
      // => success arm
      kept.push(out.value); // => keep the trusted line
    } else {
      // => failure arm
      skipped += 1; // => count the skip
      console.log("skip:", out.error); // => Output: skip: bad qty in: pen,0,3
    } // => end of else
  } // => end of for (const raw of rows)
  const total = kept.reduce((n, l) => n + lineTotal(l), 0); // => grand total
  const report = [`lines: ${kept.length}`, ...kept.map((l) => `${l.item}: ${lineTotal(l)}`), `total: ${total}`]; // => report body
  writeFileSync(join(tmpdir(), "report.txt"), report.join("\n") + "\n"); // => scratch report, path never printed
  console.log(`lines: ${kept.length}`); // => Output: lines: 2
  console.log(`total: ${total}`); // => Output: total: 350
  console.log(`wrote: report.txt (${report.length} lines)`); // => Output: wrote: report.txt (4 lines)
} // => end of function main(): void
main(); // => sync main: every failure is data, nothing escapes
