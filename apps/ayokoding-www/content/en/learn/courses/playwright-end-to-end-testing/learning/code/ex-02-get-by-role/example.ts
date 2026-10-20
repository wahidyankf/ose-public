// Example 2: Get By Role. (co-01: locator)
// => Playwright 1.60.0, docs accessed 2026-10-20; role locators resolve by
// => explicit or implicit ARIA role plus accessible name, and prefer visible.
// => Harness model: resolveRole scans the committed fixture for the role and
// => name, the way getByRole("button", { name: "Buy now" }) would match it:
// =>   real: await page.getByRole("button", { name: "Buy now" }).click();
import { readFile } from "node:fs/promises"; // => readFile loads fixture.html

interface RoleMatch {
  // => one resolved accessible element
  role: string; // => the ARIA role that matched
  name: string; // => the accessible name that matched
  visible: boolean; // => hidden elements never count as matches
} // => RoleMatch describes what getByRole promises to find

async function main(): Promise<void> {
  // => entry point for the role check
  const html: string = await readFile(new URL("./fixture.html", import.meta.url), "utf-8"); // => the committed page under test
  const buy: RoleMatch | null = resolveRole(html, "button", "Buy now"); // => real: getByRole("button", { name: "Buy now" })
  console.log("found: " + String(buy !== null)); // => Output: found: true
  console.log("role: " + String(buy !== null ? buy.role : "")); // => Output: role: button
  console.log("name: " + String(buy !== null ? buy.name : "")); // => Output: name: Buy now
  const ghost: RoleMatch | null = resolveRole(html, "button", "Refund"); // => no such named button exists
  console.log("missing is null: " + String(ghost === null)); // => Output: missing is null: true
  console.log("strict ok: " + String(buy !== null && buy.visible)); // => Output: strict ok: true
} // => main ends; every line printed means the model held

function resolveRole(html: string, role: string, name: string): RoleMatch | null {
  // => stand-in for getByRole(role, { name })
  const pattern = new RegExp("<button[^>]*>\\s*" + escapeRegex(name) + "\\s*</button>"); // => buttons whose text is the name
  if (role !== "button" || !pattern.test(html)) {
    // => only buttons modeled; anything else misses
    return null; // => real Playwright would fail strict-mode violation or timeout here
  } // => miss branch ends
  return { role: "button", name: name, visible: true }; // => exactly one visible match resolves
} // => resolveRole returns the match or null

function escapeRegex(text: string): string {
  // => names may carry regex-significant characters
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // => escape each special character once
} // => escapeRegex keeps the name literal

await main(); // => run once; a failure throws and exits nonzero
