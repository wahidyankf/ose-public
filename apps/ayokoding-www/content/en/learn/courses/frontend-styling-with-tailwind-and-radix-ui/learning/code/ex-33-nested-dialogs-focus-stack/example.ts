// => Worked Example 33: nested dialogs stack focus and unwind in order.
// => co-07: each dialog remembers its own opener; closes redeem bottom-up.
// => co-10: each layer portals above the last, so stacking is visual too.
function focusStack(trigger: string, events: string[]): string[] {
  // => replay opens and closes against a seeded stack
  // => bottom of stack below: the trigger that started it all
  const stack: string[] = [trigger]; // => bottom of stack: the trigger that started it all
  const log: string[] = ["focus now: " + trigger]; // => the transcript opens where the page was
  for (const event of events) {
    // => handle one user action per pass
    if (event.startsWith("open:")) {
      // => the open branch
      stack.push(event.slice(5)); // => open pushes the new owner
      log.push("focus now: " + event.slice(5)); // => record the new owner
    } // => open branch done
    if (event === "close" && stack.length > 1) {
      // => the close branch
      stack.pop(); // => close pops back to the opener
      log.push("focus now: " + String(stack[stack.length - 1])); // => record the restored opener
    } // => close branch done
  } // => all events replayed, stack never inverted
  return log; // => opens and closes alternate; the stack never inverts
} // => replayer complete
function main(): void {
  // => open twice, unwind twice
  // => entry point; dialog over dialog, then unwind to the trigger
  const log: string[] = focusStack("settings-button", ["open:dialog-a", "open:dialog-b", "close", "close"]); // => two opens, two closes
  console.log(log[1]); // => Output: focus now: dialog-a
  console.log(log[2]); // => Output: focus now: dialog-b
  console.log(log[3]); // => Output: focus now: dialog-a
  console.log(log[4]); // => Output: focus now: settings-button
} // => main ends; the stack proven four deep
main(); // => run once; a throw exits nonzero
