// Example 39: Shared Steps Without Inheritance. (co-04: page-object)
// => Playwright 1.60.0, docs accessed 2026-10-20; shared behavior belongs
// => in plain helper functions taking the page, not in base classes: helpers
// => compose freely while inheritance locks every test into one hierarchy.
// => The fixtures chapter extends this with test.extend:
// =>   real: async function payAs(page: Page, user: string) { ... } // imported, not inherited
async function main(): Promise<void> {
  // => entry point for the helper check
  const log: string[] = []; // => every helper call records its name
  await payAs(log, "guest"); // => first test uses the helper
  await payAs(log, "member"); // => second test reuses it unchanged
  console.log("calls: " + log.join(",")); // => Output: calls: payAs(guest),payAs(member)
  console.log("helper reused: " + String(log.length === 2)); // => Output: helper reused: true
  console.log("no base class: " + String(!log.some((entry) => entry.includes("extends")))); // => Output: no base class: true
} // => main ends; composition beat inheritance

async function payAs(log: string[], user: string): Promise<void> {
  // => the shared checkout helper
  log.push("payAs(" + user + ")"); // => one line per use, no class needed
} // => payAs is imported by any test that pays

await main(); // => run once; a failure throws and exits nonzero
