// => Kata 1 starter: Enter opens the menu but Escape no longer closes it.
// => Task: keep the shortcut AND restore the default Escape dismissal.
// => The answer must close on Escape and still open Enter.
function menuModel(key: string, open: boolean): boolean {
  // => broken model: Enter opens, nothing ever closes
  // => one key is handled below; every other key falls through
  if (key === "Enter") {
    // => the shortcut branch
    return true; // => shortcut works
  } // => shortcut branch done
  return open; // => BUG: Escape falls through and the menu stays open
} // => model complete, bug intact
function main(): void {
  // => run the broken model once
  // => entry point; the bug shows as a stuck-open menu
  console.log("enter opens: " + String(menuModel("Enter", false))); // => starter prints true here, correctly
  console.log("escape closes: " + String(!menuModel("Escape", true))); // => starter prints false: the bug
} // => main ends; the transcript proves the stuck menu
main(); // => run once; a throw exits nonzero
