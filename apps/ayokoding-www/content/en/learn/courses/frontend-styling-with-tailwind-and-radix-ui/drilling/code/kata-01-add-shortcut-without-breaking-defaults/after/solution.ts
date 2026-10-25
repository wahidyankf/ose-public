// => Kata 1 solution: add the shortcut beside the default, never over it.
// => co-08: Escape keeps its documented dismissal meaning.
// => co-09: the primitive's key map stays complete; the shortcut is additive.
function menuModel(key: string, open: boolean): boolean {
  // => fixed model: the shortcut opens, the default still closes
  // => each key below owns exactly one outcome
  if (key === "Enter") {
    // => the shortcut branch
    return true; // => added shortcut: Enter opens from the trigger
  } // => shortcut branch done
  if (key === "Escape") {
    // => the default branch
    return false; // => default preserved: Escape always closes
  } // => default branch done
  return open; // => every other key changes nothing
} // => model complete, both contracts holding
function main(): void {
  // => run the fixed model once
  // => entry point; both contracts hold at once
  console.log("enter opens: " + String(menuModel("Enter", false))); // => Output: enter opens: true
  console.log("escape closes: " + String(!menuModel("Escape", true))); // => Output: escape closes: true
  console.log("other keys keep state: " + String(menuModel("Tab", true))); // => Output: other keys keep state: true
} // => main ends; the transcript proves both contracts
main(); // => run once; a throw exits nonzero
