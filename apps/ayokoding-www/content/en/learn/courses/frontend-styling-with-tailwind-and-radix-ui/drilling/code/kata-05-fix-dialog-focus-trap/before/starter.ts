// => Kata 5 starter: Escape closes but focus is left wherever it was.
// => Task: fix the dialog so focus returns to the trigger (see Example 29).
// => The answer must end every close path on the trigger.
function closeDialog(trigger: string): string {
  // => broken: closes the dialog and abandons focus inside it
  void trigger; // => BUG: the claim ticket is accepted and never redeemed
  return "closed, focus now: dialog-content"; // => focus stranded where the dialog was
}
function main(): void {
  // => entry point; the close works and the focus does not
  console.log(closeDialog("settings-button")); // => starter prints the stranded focus
  console.log("focus on trigger: false"); // => starter admits the failure
}
main(); // => run once; a throw exits nonzero
