// Example 59: Form Labels and Focus Order. (co-08: accessibility-scan)
// => Playwright 1.60.0, docs accessed 2026-10-20; every input needs a label
// => and the tab order must follow the visual order; the test tabs through
// => the form with keyboard.press("Tab") and asserts each stop lands where
// => a sighted keyboard user expects:
// =>   real: await page.keyboard.press("Tab"); await expect(page.getByLabel("Email")).toBeFocused();
import { readFile } from "node:fs/promises"; // => readFile loads fixture.html

async function main(): Promise<void> {
  // => entry point for the focus check
  const html: string = await readFile(new URL("./fixture.html", import.meta.url), "utf-8"); // => the committed page under test
  const unlabeled: string[] = unlabeledInputs(html); // => inputs no label points at
  console.log("unlabeled: " + unlabeled.join(",")); // => Output: unlabeled: phone
  const order: string[] = tabOrder(html); // => the ids Tab would visit, in order
  console.log("tab order: " + order.join(",")); // => Output: tab order: email,city,phone,submit
  console.log("unlabeled still tabbable: " + String(order.includes("phone"))); // => Output: unlabeled still tabbable: true
  console.log("labels cover all but one: " + String(unlabeled.length === 1)); // => Output: labels cover all but one: true
} // => main ends; one missing label, order correct

function unlabeledInputs(html: string): string[] {
  // => stand-in for the label-coverage rule
  const ids: string[] = Array.from(html.matchAll(/<input[^>]*id="([^"]+)"/g), (m) => String(m[1])); // => every input id
  return ids.filter((id) => !new RegExp('for="' + id + '"').test(html)); // => ids no label points at
} // => unlabeledInputs lists the gaps

function tabOrder(html: string): string[] {
  // => stand-in for repeated Tab presses
  const ids: string[] = Array.from(html.matchAll(/<(?:input|button)[^>]*id="([^"]+)"/g), (m) => String(m[1])); // => focusable ids in DOM order
  return ids.filter((id) => !new RegExp('<[^>]*id="' + id + '"[^>]*disabled').test(html)); // => skip disabled controls
} // => tabOrder follows the order keyboard users meet

await main(); // => run once; a failure throws and exits nonzero
