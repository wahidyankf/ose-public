// Capstone: the store checkout suite. Six checks run one realistic journey
// against the committed fixture: navigate, add by test id, mock and wait for
// the total API, reuse saved auth, compare the masked receipt baseline, and
// record a trace. Every check prints PASS; the suite exits nonzero on the
// first red check, like a real runner stopping at the first failure.
// (co-01 locator, co-02 auto-waiting, co-05 network-interception,
//  co-12 authentication-state, co-07 visual-comparison, co-06 trace-viewer)
import { readFile } from "node:fs/promises"; // => readFile loads fixture.html

interface Check {
  // => one suite check and its verdict
  name: string; // => what the check proves
  pass: boolean; // => green or red
} // => Check is one row of the final report

async function main(): Promise<void> {
  // => entry point for the suite
  const html: string = await readFile(new URL("./fixture.html", import.meta.url), "utf-8"); // => the store under test
  const trace: string[] = []; // => the suite trace, one event per step
  const results: Check[] = []; // => every check verdict lands here
  results.push(check("navigate to catalog", html.includes('id="catalog"'), trace)); // => real: await page.goto("/"); catalog visible
  results.push(check("add milk by test id", html.includes('data-testid="add-milk"'), trace)); // => real: getByTestId("add-milk").click()
  const total: string = mockedTotal(trace); // => real: route.fulfill + waitForResponse("**/api/total")
  results.push(check("total settled at $5.00", total === "$5.00", trace)); // => the mock answered, the UI shows it
  results.push(check("auth reused, no login typed", savedSession() === "ada", trace)); // => real: storageState: "ada.json"
  const receipt: string = maskedReceipt(html); // => real: toHaveScreenshot({ mask: [clock] })
  results.push(check("receipt matches baseline", receipt === "Total: $5.00 at [time]", trace)); // => masked clock, exact rest
  results.push(check("trace recorded every step", trace.length === 6, trace)); // => real: trace.zip kept as CI artifact
  for (const result of results) {
    // => report every check
    console.log((result.pass ? "PASS" : "FAIL") + ": " + result.name); // => one row per check
  } // => report ends
  const passed: number = results.filter((result) => result.pass).length; // => count the green checks
  console.log("suite: " + String(passed) + " passed, " + String(results.length - passed) + " failed"); // => the suite verdict
  if (passed !== results.length) {
    // => any red check fails the suite
    throw new Error("capstone suite red"); // => like a real runner: nonzero on failure
  } // => green suite ends here
} // => main ends; six checks, one verdict

function check(name: string, pass: boolean, trace: string[]): Check {
  // => stand-in for one test asserting
  trace.push(name); // => the step lands in the trace too
  return { name: name, pass: pass }; // => record the verdict
} // => check runs one assertion and records it

function mockedTotal(trace: string[]): string {
  // => stand-in for route.fulfill plus waitForResponse
  trace.push("wait for /api/total"); // => the suite waits for the settled total
  return "$5.00"; // => the mock answers: milk plus bread
} // => mockedTotal serves the settled data

function savedSession(): string {
  // => stand-in for storageState load
  return "ada"; // => the setup project logged in once; the suite reuses it
} // => savedSession proves no password was typed

function maskedReceipt(html: string): string {
  // => stand-in for the masked screenshot compare
  const found = html.match(/Total: (\$[0-9.]+) at [0-9:]+/); // => total plus clock in the receipt
  const total: string = found !== null && found[1] !== undefined ? found[1] : "?"; // => the settled total
  void html; // => the fixture bytes are consumed by the match above
  return "Total: " + total + " at [time]"; // => masked clock, exact total
} // => maskedReceipt canonicalizes the receipt for compare

await main(); // => run once; a failure throws and exits nonzero
