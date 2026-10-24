// Example 3: Get By Text and Label. (co-01: locator)
// => Playwright 1.60.0, docs accessed 2026-10-20; getByText matches
// => non-interactive text (case-insensitive, whitespace-normalized, substring
// => by default, exact: true for full match); getByLabel finds the control a
// => <label> labels, which is how real users find form fields:
// =>   real: await page.getByLabel("Email").fill("ada@example.com");
import { readFile } from "node:fs/promises"; // => readFile loads fixture.html

async function main(): Promise<void> {
  // => entry point for the label check
  const html: string = await readFile(new URL("./fixture.html", import.meta.url), "utf-8"); // => the committed page under test
  const emailId: string | null = controlForLabel(html, "Email"); // => real: getByLabel("Email")
  console.log("control id: " + String(emailId)); // => Output: control id: email
  console.log("label ok: " + String(emailId === "email")); // => Output: label ok: true
  const heading: boolean = hasText(html, "Create your account"); // => real: getByText("Create your account")
  console.log("heading text found: " + String(heading)); // => Output: heading text found: true
  const exact: boolean = hasExactText(html, "Create your"); // => substring of the h1, exact match of no node
  console.log("exact rejects substring: " + String(!exact)); // => Output: exact rejects substring: true
  const missing: string | null = controlForLabel(html, "Phone"); // => no Phone label exists
  console.log("missing label is null: " + String(missing === null)); // => Output: missing label is null: true
} // => main ends; every line printed means the model held

function controlForLabel(html: string, label: string): string | null {
  // => stand-in for getByLabel
  const pattern = new RegExp('<label[^>]*for="([^"]+)"[^>]*>\\s*' + label + "\\s*</label>"); // => label elements pointing at a control id
  const found = pattern.exec(html); // => first matching label wins
  return found !== null && found[1] !== undefined ? found[1] : null; // => the control id, or null when unlabeled
} // => controlForLabel returns the labeled control's id

function normalize(text: string): string {
  // => Playwright normalizes whitespace before matching
  return text.replace(/\s+/g, " ").trim().toLowerCase(); // => collapse runs, trim ends, ignore case
} // => normalize mirrors the matching rules

function hasText(html: string, wanted: string): boolean {
  // => stand-in for getByText substring match
  const bodies: string[] = Array.from(html.matchAll(/>([^<>]+)</g), (m) => normalize(m[1] ?? "")); // => every text node, normalized
  return bodies.some((body) => body.includes(normalize(wanted))); // => true when any node contains the wanted text
} // => hasText reports substring presence

function hasExactText(html: string, wanted: string): boolean {
  // => stand-in for getByText(wanted, { exact: true })
  const bodies: string[] = Array.from(html.matchAll(/>([^<>]+)</g), (m) => normalize(m[1] ?? "")); // => every text node, normalized
  return bodies.some((body) => body === normalize(wanted)); // => true only on a full normalized match
} // => hasExactText reports exact presence

await main(); // => run once; a failure throws and exits nonzero
