// Example 6: Fill and Type. (co-01: locator)
// => Playwright 1.60.0, docs accessed 2026-10-20; fill replaces the whole
// => value in one step (fast, clears first), pressSequentially types key by
// => key (slow, realistic for autocomplete); both wait for an editable field:
// =>   real: await page.getByLabel("City").fill("Oslo");
interface Field {
  // => one modeled form field
  id: string; // => the control id the label points at
  value: string; // => the current text inside the field
  typed: string[]; // => the key-by-key log, empty for fill
} // => Field records how the value got there, not just the value

async function main(): Promise<void> {
  // => entry point for the fill check
  const city: Field = { id: "city", value: "Bergen", typed: [] }; // => the field starts pre-filled
  fill(city, "Oslo"); // => real: await page.getByLabel("City").fill("Oslo")
  console.log("after fill: " + city.value); // => Output: after fill: Oslo
  console.log("fill clears first: " + String(city.value === "Oslo")); // => Output: fill clears first: true
  const search: Field = { id: "search", value: "", typed: [] }; // => autocomplete starts empty
  pressSequentially(search, "mil"); // => real: await page.getByLabel("Search").pressSequentially("mil")
  console.log("typed value: " + search.value); // => Output: typed value: mil
  console.log("keystrokes: " + search.typed.join(",")); // => Output: keystrokes: m,i,l
  console.log("fill is one step: " + String(city.typed.length === 0)); // => Output: fill is one step: true
} // => main ends; fill replaced, typing logged each key

function fill(field: Field, text: string): void {
  // => stand-in for locator.fill
  field.value = text; // => the old value is replaced wholesale
} // => fill leaves no keystroke log

function pressSequentially(field: Field, text: string): void {
  // => stand-in for pressSequentially
  for (const key of text) {
    // => one iteration per keystroke
    field.value += key; // => the value grows left to right
    field.typed.push(key); // => each key is logged for autocomplete handlers
  } // => every key delivered
} // => pressSequentially models human-paced typing

await main(); // => run once; a failure throws and exits nonzero
