// Example 5: Chained and Filtered Locators. (co-01: locator)
// => Playwright 1.60.0, docs accessed 2026-10-20; locators chain with >> or
// => locator().filter(hasText) to narrow a broad match to one row, and the
// => chain re-resolves from the page on every action, so it never goes stale:
// =>   real: page.locator("tr").filter({ hasText: "Milk" }).getByRole("button")
import { readFile } from "node:fs/promises"; // => readFile loads fixture.html

async function main(): Promise<void> {
  // => entry point for the chaining check
  const html: string = await readFile(new URL("./fixture.html", import.meta.url), "utf-8"); // => the committed page under test
  const rows: string[] = tableRows(html); // => real: page.locator("tr") finds every row
  console.log("rows: " + String(rows.length)); // => Output: rows: 3
  const milk: string[] = rows.filter((row) => row.includes("Milk")); // => real: .filter({ hasText: "Milk" })
  console.log("milk rows: " + String(milk.length)); // => Output: milk rows: 1
  const button: boolean = milk.length === 1 && (milk[0] as string).includes("<button"); // => real: .getByRole("button") inside the row
  console.log("milk row has button: " + String(button)); // => Output: milk row has button: true
  const bread: string[] = rows.filter((row) => row.includes("Bread")); // => narrow to the Bread row instead
  console.log("bread row has button: " + String(bread.length === 1 && (bread[0] as string).includes("<button"))); // => Output: bread row has button: true
  console.log("chain narrows: " + String(rows.length > milk.length)); // => Output: chain narrows: true
} // => main ends; filtering turned three rows into one

function tableRows(html: string): string[] {
  // => stand-in for locator("tr")
  const found = html.match(/<tr>[\s\S]*?<\/tr>/g); // => every table row in order
  return found !== null ? found : []; // => [] when the table has no rows
} // => tableRows returns the broad set the filter narrows

await main(); // => run once; a failure throws and exits nonzero
