// => Worked Example 18: Escape closes the dialog and pays focus back.
// => co-07: the claim ticket from Example 17 is redeemed here.
// => co-08: Escape is the dialog's documented dismissal key.
function pressEscape(open: boolean, trigger: string): string[] {
  // => model the Escape contract: close, then restore
  // => closed dialogs below ignore the key
  if (!open) {
    // => the already-closed branch
    return ["dialog already closed: nothing to do"]; // => closed dialogs ignore the key
  } // => already-closed branch done
  return ["dialog closed", "focus now: " + trigger]; // => close first, focus back second, always in this order
} // => model complete, total contract kept
function main(): void {
  // => press Escape on open and closed dialogs
  // => entry point; the key every dialog user already knows
  const transcript: string[] = pressEscape(true, "settings-button"); // => open dialog, user presses Escape
  console.log(transcript[0]); // => Output: dialog closed
  console.log(transcript[1]); // => Output: focus now: settings-button
  console.log("closed dialog ignores escape: " + String(pressEscape(false, "x")[0])); // => Output: closed dialog ignores escape: dialog already closed: nothing to do
} // => main ends; total contract proven twice
main(); // => run once; a throw exits nonzero
