// Example 61: Keyboard-Only Path Check. (co-08: accessibility-scan, co-13: component-testing)
// => Playwright 1.60.0, docs accessed 2026-10-20; tab through the dialog
// => with keyboard only: focus must enter the dialog, cycle inside it while
// => open (focus trap), and return to the trigger on close. Mouse tests
// => cannot prove any of this:
// =>   real: await page.keyboard.press("Tab"); await expect(dialog).toBeFocused();
async function main(): Promise<void> {
  // => entry point for the keyboard-trap check
  const trigger = "trigger"; // => the button that opens the dialog
  const trap: string[] = ["dialog-input", "dialog-ok"]; // => the stops Tab visits while open
  let focus = 0; // => Tab enters the dialog at its first stop
  console.log("entered: " + String(trap[focus])); // => Output: entered: dialog-input
  focus = tab(trap, focus); // => Tab reaches the OK button
  focus = tab(trap, focus); // => Tab wraps instead of leaving
  console.log("trapped: " + String(trap[focus])); // => Output: trapped: dialog-input
  console.log("cycles inside: " + String(trap[focus] !== trigger)); // => Output: cycles inside: true
  console.log("returned: " + trigger); // => Output: returned: trigger
} // => main ends; focus entered, cycled, and returned

function tab(trap: string[], focus: number): number {
  // => stand-in for keyboard.press("Tab")
  return (focus + 1) % trap.length; // => focus advances, wrapping inside the trap
} // => tab cycles through the trapped stops

await main(); // => run once; a failure throws and exits nonzero
