// Example 58: Axe Scan Finds Missing Names. (co-08: accessibility-scan)
// => Playwright 1.60.0 plus @axe-core/playwright 4.10.1, docs accessed
// => 2026-10-20; AxeBuilder scans the page for violations (missing names,
// => low contrast, bad structure) and the test asserts zero violations; the
// => scan runs in the same browser the functional tests already drive:
// =>   real: const r = await new AxeBuilder({ page }).analyze(); expect(r.violations).toEqual([]);
import { readFile } from "node:fs/promises"; // => readFile loads fixture.html

interface Violation {
  // => one accessibility violation
  rule: string; // => the rule id, for example image-alt
  target: string; // => the offending markup excerpt
} // => Violation names what to fix and where

async function main(): Promise<void> {
  // => entry point for the scan check
  const html: string = await readFile(new URL("./fixture.html", import.meta.url), "utf-8"); // => the committed page under test
  const found: Violation[] = scan(html); // => real: await new AxeBuilder({ page }).analyze()
  console.log("violations: " + String(found.length)); // => Output: violations: 2
  console.log("first rule: " + String(found[0]?.rule)); // => Output: first rule: image-alt
  console.log("second rule: " + String(found[1]?.rule)); // => Output: second rule: button-name
  console.log("scan names culprits: " + String(found.length === 2)); // => Output: scan names culprits: true
} // => main ends; two violations, both named

function scan(html: string): Violation[] {
  // => stand-in for AxeBuilder.analyze
  const out: Violation[] = []; // => every violation lands here
  for (const match of html.matchAll(/<img(?![^>]*\salt=)[^>]*>/g)) {
    // => images with no alt attribute
    out.push({ rule: "image-alt", target: match[0].slice(0, 24) }); // => the image needs a text alternative
  } // => image pass ends
  for (const match of html.matchAll(/<button(?![^>]*aria-label)[^>]*>\s*<\/button>/g)) {
    // => empty buttons with no name
    out.push({ rule: "button-name", target: match[0].slice(0, 24) }); // => the button needs an accessible name
  } // => button pass ends
  return out; // => [] would mean zero violations
} // => scan lists every violation at once

await main(); // => run once; a failure throws and exits nonzero
