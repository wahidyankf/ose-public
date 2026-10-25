// => Worked Example 17: opening a dialog moves focus inside it.
// => co-07: the trigger keeps a claim ticket; the dialog takes focus now.
function openDialog(trigger: string): string[] {
  // => model the focus handoff the primitive performs on open
  const log: string[] = []; // => the focus transcript for this open
  log.push("focus was: " + trigger); // => before: the trigger owns focus
  log.push("focus now: dialog-content"); // => after: the dialog content owns focus
  return log; // => two entries, never zero and never reversed
}
function main(): void {
  // => entry point; read the handoff top to bottom
  const transcript: string[] = openDialog("settings-button"); // => the user pressed the settings trigger
  console.log(transcript[0]); // => Output: focus was: settings-button
  console.log(transcript[1]); // => Output: focus now: dialog-content
  console.log("tab stays inside while open: true"); // => Output: tab stays inside while open: true
}
main(); // => run once; a throw exits nonzero
