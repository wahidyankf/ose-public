// Example 4: Test IDs Beat CSS. (co-01: locator)
// => Playwright 1.60.0, docs accessed 2026-10-20; getByTestId targets
// => data-testid attributes, which survive redesigns that rename every CSS
// => class; CSS selectors couple the test to styling details and rot first:
// =>   real: await page.getByTestId("checkout-submit").click();
import { readFile } from "node:fs/promises"; // => readFile loads fixture.html

interface Resolved {
  // => one located element, however it was found
  how: string; // => the strategy that found it: testid or css
  tag: string; // => the element tag that matched
  stable: boolean; // => true when a redesign keeps this selector working
} // => Resolved records the cost of the strategy, not just the hit

async function main(): Promise<void> {
  // => entry point for the selector comparison
  const html: string = await readFile(new URL("./fixture.html", import.meta.url), "utf-8"); // => the committed page under test
  const byTestId: Resolved | null = byTestIdAttr(html, "checkout-submit"); // => real: getByTestId("checkout-submit")
  console.log("testid found: " + String(byTestId !== null)); // => Output: testid found: true
  console.log("testid tag: " + String(byTestId !== null ? byTestId.tag : "")); // => Output: testid tag: button
  const redesigned: string = redesign(html); // => rename every CSS class, keep test ids
  const cssAfter: Resolved | null = byCssClass(redesigned, "btn-primary-x"); // => the old class is gone after redesign
  console.log("css survives redesign: " + String(cssAfter !== null)); // => Output: css survives redesign: false
  const idAfter: Resolved | null = byTestIdAttr(redesigned, "checkout-submit"); // => test ids ignore styling churn
  console.log("testid survives redesign: " + String(idAfter !== null)); // => Output: testid survives redesign: true
  console.log("stable strategy: " + String(idAfter !== null ? idAfter.how : "")); // => Output: stable strategy: testid
} // => main ends; the redesign proves which selector to trust

function byTestIdAttr(html: string, id: string): Resolved | null {
  // => stand-in for getByTestId
  const found = new RegExp('<([a-z]+)[^>]*data-testid="' + id + '"').exec(html); // => any tag carrying the test id
  if (found === null || found[1] === undefined) {
    // => no element carries this id
    return null; // => real Playwright would time out waiting for it
  } // => miss branch ends
  return { how: "testid", tag: found[1], stable: true }; // => test ids are styling-independent
} // => byTestIdAttr resolves the stable hook

function byCssClass(html: string, cls: string): Resolved | null {
  // => stand-in for a CSS class selector
  const found = new RegExp('<([a-z]+)[^>]*class="[^"]*\\b' + cls + "\\b").exec(html); // => any tag with the class
  if (found === null || found[1] === undefined) {
    // => the class renamed or never existed
    return null; // => CSS couples the test to the stylesheet
  } // => miss branch ends
  return { how: "css", tag: found[1], stable: false }; // => works today, rots on redesign
} // => byCssClass resolves the brittle hook

function redesign(html: string): string {
  // => simulate a styling pass renaming classes
  return html.replace(/btn-primary-x/g, "cta-ember-2"); // => classes change; markup and test ids stay
} // => redesign keeps behavior, churns presentation

await main(); // => run once; a failure throws and exits nonzero
