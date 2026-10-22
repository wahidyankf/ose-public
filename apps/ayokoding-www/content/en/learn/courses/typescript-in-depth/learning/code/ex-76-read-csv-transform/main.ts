/// <reference path="./node.d.ts" />
// => Example 76: read the stages first: split, shape, filter, total.
import { readFileSync } from "node:fs"; // => read the committed fixture
interface Line {
  // => the shaped row
  item: string; // => product name
  qty: number; // => units ordered
  price: number; // => unit price
} // => end of interface Line
function parse(csv: string): Line[] {
  // => header skipped, rows shaped
  return csv
    .split("\n")
    .slice(1)
    .filter((l) => l.trim() !== "")
    .map((l) => {
      // => drop header and blanks
      const [item, qty, price] = l.split(","); // => three columns
      return { item: item.trim(), qty: Number(qty), price: Number(price) }; // => shaped row
    }); // => end of return csv.split("\n").slice(1).filter((l) => l.trim
} // => end of function parse(csv: string): Line[]
const lines = parse(readFileSync("rows.csv", "utf-8")); // => fixture parsed
const bulk = lines.filter((l) => l.qty >= 2); // => WHY filter: bulk lines only
for (const l of bulk) {
  // => report each kept line
  console.log(`${l.item}: ${l.qty}x${l.price}=${l.qty * l.price}`); // => Output: lamp and desk lines
} // => end of for (const l of bulk)
console.log(
  "total:",
  bulk.reduce((n, l) => n + l.qty * l.price, 0),
); // => Output: total: 350
