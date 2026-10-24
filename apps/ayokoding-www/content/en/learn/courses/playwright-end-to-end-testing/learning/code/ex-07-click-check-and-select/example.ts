// Example 7: Click Check and Select. (co-01: locator)
// => Playwright 1.60.0, docs accessed 2026-10-20; check toggles checkboxes
// => and radios to a wanted state (unlike click, it asserts the end state),
// => selectOption picks <select> entries by value, label, or index:
// =>   real: await page.getByLabel("Express").check();
interface Widget {
  // => one modeled form widget
  kind: string; // => checkbox, radio, or select
  checked: boolean; // => the current on/off state
  value: string; // => the selected option value for selects
} // => Widget holds the state assertions read back

async function main(): Promise<void> {
  // => entry point for the widget check
  const express: Widget = { kind: "checkbox", checked: false, value: "" }; // => unchecked shipping option
  check(express); // => real: await page.getByLabel("Express").check()
  console.log("express checked: " + String(express.checked)); // => Output: express checked: true
  uncheck(express); // => real: await page.getByLabel("Express").uncheck()
  console.log("express unchecked: " + String(!express.checked)); // => Output: express unchecked: true
  const size: Widget = { kind: "select", checked: false, value: "m" }; // => size starts at M
  selectOption(size, "xl"); // => real: await page.getByLabel("Size").selectOption("xl")
  console.log("size: " + size.value); // => Output: size: xl
  const agree: Widget = { kind: "checkbox", checked: true, value: "" }; // => already checked
  check(agree); // => check on a checked box stays checked, no toggle
  console.log("idempotent: " + String(agree.checked)); // => Output: idempotent: true
} // => main ends; each widget holds its wanted state

function check(widget: Widget): void {
  // => stand-in for locator.check
  widget.checked = true; // => end state is checked, whatever it was
} // => check asserts the state instead of toggling it

function uncheck(widget: Widget): void {
  // => stand-in for locator.uncheck
  widget.checked = false; // => end state is unchecked, whatever it was
} // => uncheck is the mirror of check

function selectOption(widget: Widget, value: string): void {
  // => stand-in for locator.selectOption
  widget.value = value; // => the wanted option becomes selected
} // => selectOption picks by value

await main(); // => run once; a failure throws and exits nonzero
