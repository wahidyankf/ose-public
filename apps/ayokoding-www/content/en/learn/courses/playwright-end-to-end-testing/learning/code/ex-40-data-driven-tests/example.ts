// Example 40: Data-Driven Tests. (co-04: page-object)
// => Playwright 1.60.0, docs accessed 2026-10-20; looping over a row table
// => runs the same test body against many inputs with one failure pointing
// => at its row; test titles interpolate the row so the report names the
// => case:
// =>   real: for (const { user, total } of rows) test(`pays ${user}`, ...)
interface CartRow {
  // => one data row
  user: string; // => who pays in this case
  total: string; // => the total they should see
} // => CartRow carries one case

async function main(): Promise<void> {
  // => entry point for the data-driven check
  const rows: CartRow[] = [
    // => the case table
    { user: "guest", total: "$3.00" }, // => guest buys milk
    { user: "member", total: "$2.40" }, // => member gets the discount
  ]; // => table fixed; cases are data, not code
  const passed: string[] = []; // => every passing case title lands here
  for (const row of rows) {
    // => one iteration per case
    const total: string = checkoutTotal(row.user); // => the behavior under test
    if (total === row.total) {
      // => the case passes
      passed.push("pays " + row.user); // => the title names its row
    } // => pass recorded
  } // => every case executed
  console.log("passed: " + passed.join("; ")); // => Output: passed: pays guest; pays member
  console.log("all rows ran: " + String(passed.length === rows.length)); // => Output: all rows ran: true
  console.log("one body, two cases: " + String(rows.length === 2)); // => Output: one body, two cases: true
} // => main ends; the table drove the test

function checkoutTotal(user: string): string {
  // => the modeled checkout total
  return user === "member" ? "$2.40" : "$3.00"; // => members get the discount
} // => checkoutTotal prices by user kind

await main(); // => run once; a failure throws and exits nonzero
