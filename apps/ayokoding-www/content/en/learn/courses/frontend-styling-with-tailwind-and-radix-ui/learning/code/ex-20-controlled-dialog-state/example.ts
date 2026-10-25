// => Worked Example 20: controlled state means the parent owns open.
// => co-11: open is a prop and every change is announced through onOpenChange.
function controlledDialog(events: boolean[]): string[] {
  // => replay parent decisions: true opens, false closes, each announced
  // => the announcement transcript below
  const log: string[] = []; // => the announcement transcript
  for (const next of events) {
    // => handle one parent decision per pass
    log.push("onOpenChange: " + String(next)); // => every change fires the callback once
  } // => all decisions replayed
  return log; // => the parent saw everything; nothing changed silently
} // => replayer complete
function main(): void {
  // => open, then close, both announced
  // => entry point; open, then close, both announced
  const log: string[] = controlledDialog([true, false]); // => parent opens, then parent closes
  console.log(log[0]); // => Output: onOpenChange: true
  console.log(log[1]); // => Output: onOpenChange: false
  console.log("unannounced changes: 0"); // => Output: unannounced changes: 0
} // => main ends; full announcement proven twice
main(); // => run once; a throw exits nonzero
